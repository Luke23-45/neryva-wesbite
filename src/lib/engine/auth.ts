/**
 * The OP session layer (OAuth-only — no passwords, OTP, or local tokens).
 *
 * Login is the Neryva Account via the engine OP: authorization_code + PKCE
 * (S256) against the pre-registered first-party client `neryva-console`.
 * Signup and signin are the same flow — first login auto-provisions the
 * account plus its personal org server-side.
 *
 * Token posture (OWASP SPA guidance — memory + rotation, never localStorage):
 *  - access token: memory only (zustand), proactive refresh ~60s pre-expiry.
 *  - refresh token: sessionStorage (survives reload, dies with the tab).
 *    The engine rotates refresh tokens with reuse detection, so a stolen
 *    token kills the family instead of silently working. A refresh that
 *    fails transiently (offline, 5xx, 429) never logs out — only a
 *    definitive 400/401/403 rejection clears the session.
 *  - cross-restart persistence: silent `prompt=none` re-auth in a hidden
 *    iframe against the first-party OP session cookie (same-origin via the
 *    /engine proxy, so no third-party-cookie issue). No long-lived secret
 *    is ever persisted in the browser.
 *  - cross-tab: logout/fatal broadcasts via a localStorage *signal*
 *    (`neryva.session_cleared` timestamp — not a credential). Tabs never
 *    share tokens (each tab holds its own rotated refresh token; sharing
 *    one would trip the engine's reuse detector and kill the family).
 *
 * The session store is the bridge the API client binds to (bindTokenSource).
 */
import { create } from 'zustand';
import { bindTokenSource, ENGINE_BASE } from './client';

const CLIENT_ID = 'neryva-console';
const SCOPES = 'openid email profile offline_access';
const CALLBACK_PATH = '/platform/auth/callback';
const REFRESH_KEY = 'neryva.refresh_token';
const RETURN_KEY = 'neryva.post_login_return';
const PKCE_KEY = 'neryva.pkce_verifier';
const STATE_KEY = 'neryva.oauth_state';
/**
 * The silent (prompt=none iframe) flow keeps its own PKCE/state keys, fully
 * isolated from the interactive login's keys above. The two flows race on
 * slow networks: the iframe's late postMessage/timeout used to blindly wipe
 * the shared keys and destroy an in-flight interactive login ("Login state
 * mismatch" on every callback). Separate keys make that interleaving
 * impossible — each flow only ever reads, validates, and cleans up its own
 * material.
 */
const SILENT_PKCE_KEY = 'neryva.silent_pkce_verifier';
const SILENT_STATE_KEY = 'neryva.silent_oauth_state';
const ID_TOKEN_KEY = 'neryva.id_token';
/** localStorage broadcast signal (timestamp) — never a credential. */
const SESSION_CLEARED_KEY = 'neryva.session_cleared';
// Short fuse under test (vitest MODE=test) so the anonymous path resolves fast.
const SILENT_TIMEOUT_MS = import.meta.env.MODE === 'test' ? 50 : 12_000;

const authBase = `${ENGINE_BASE}/auth`;

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return new Uint8Array(digest);
}

/** In-app return targets only — never a protocol, host, or protocol-relative URL. */
export function isSafeReturnPath(target: string | null | undefined): target is string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return false;
  }
  if (target.includes('\\') || /[\r\n]/.test(target)) {
    return false;
  }
  try {
    const url = new URL(target, 'https://console.invalid');
    return url.origin === 'https://console.invalid';
  } catch {
    return false;
  }
}

// ── Session store (memory-first) ────────────────────────────────────────────

export interface SessionAccount {
  id: string;
  email: string | null;
  name: string | null;
}

interface SessionState {
  accessToken: string | null;
  /** Engine account (id, email, display name) — from GET /auth/me. */
  account: SessionAccount | null;
  status: 'unknown' | 'authenticated' | 'anonymous';
  setSession: (accessToken: string, account: SessionState['account']) => void;
  /** Local clear. Broadcasts logout-everywhere unless told not to (we received it). */
  clear: (opts?: { broadcast?: boolean }) => void;
  hydrate: () => Promise<void>;
}

function clearAuthMaterial(): void {
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(ID_TOKEN_KEY);
  sessionStorage.removeItem(PKCE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(SILENT_PKCE_KEY);
  sessionStorage.removeItem(SILENT_STATE_KEY);
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  account: null,
  status: 'unknown',
  setSession: (accessToken, account) => set({ accessToken, account, status: 'authenticated' }),
  clear: (opts) => {
    stopProactiveRefresh();
    clearAuthMaterial();
    set({ accessToken: null, account: null, status: 'anonymous' });
    notifySessionCleared();
    if (opts?.broadcast !== false) {
      try {
        localStorage.setItem(SESSION_CLEARED_KEY, String(Date.now()));
      } catch {
        /* private mode — this tab still clears */
      }
    }
  },
  hydrate: () => hydrateSession(),
}));

// ── Session-clear subscribers (org scope, query caches) ────────────────────
// Runs synchronously inside `clear()` — before any redirect — so derived
// state (active org, cached org/account queries) can never outlive the
// session, even when logout ends in a full-page navigation that would
// otherwise win the race against a React effect.

type SessionClearListener = () => void;

const sessionClearListeners = new Set<SessionClearListener>();

/** Subscribe to local session death (logout, fatal auth, reuse tripwire). Returns an unsubscribe. */
export function onSessionCleared(fn: SessionClearListener): () => void {
  sessionClearListeners.add(fn);
  return () => {
    sessionClearListeners.delete(fn);
  };
}

function notifySessionCleared(): void {
  for (const fn of sessionClearListeners) {
    try {
      fn();
    } catch {
      /* one bad subscriber must never break logout */
    }
  }
}

// ── Cross-tab logout-everywhere (signal only, registered once) ──────────────

let tabSyncRegistered = false;

function registerTabSync(): void {
  if (tabSyncRegistered || typeof window === 'undefined') {
    return;
  }
  tabSyncRegistered = true;
  window.addEventListener('storage', (event) => {
    if (event.key === SESSION_CLEARED_KEY && event.newValue) {
      // Another tab logged out or died fatally — follow without rebroadcasting.
      useSessionStore.getState().clear({ broadcast: false });
    }
  });
}

// ── Token endpoint grants ───────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
}

/**
 * The token endpoint is unreachable or failed transiently (offline, 5xx, 429).
 * This is NOT session death: the grant may still be valid, so callers must
 * keep the session (and never broadcast a logout) when they see this.
 * Detected by `name` across the client boundary to avoid a module cycle.
 */
export class TransientAuthError extends Error {
  constructor(message = 'Authentication service temporarily unavailable') {
    super(message);
    this.name = 'TransientAuthError';
  }
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function stopProactiveRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

/** Proactive refresh: renew ~60s before expiry so UI never sees a dead token. */
function scheduleProactiveRefresh(expiresInSeconds?: number): void {
  stopProactiveRefresh();
  const seconds = expiresInSeconds ?? 14 * 60;
  const lead = Math.min(60, Math.floor(seconds / 3));
  refreshTimer = setTimeout(() => {
    void refreshTokens().catch(() => undefined);
  }, Math.max(5, seconds - lead) * 1000);
}

async function tokenGrant(body: Record<string, string>): Promise<TokenResponse | null> {
  let response: Response;
  try {
    response = await fetch(`${authBase}/token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: CLIENT_ID, ...body }).toString(),
    });
  } catch {
    // No response at all (offline, DNS, proxy down) — the grant may still be
    // valid. Never report this as session death; callers keep the session.
    throw new TransientAuthError('Cannot reach the authentication service');
  }
  if (response.ok) {
    return (await response.json()) as TokenResponse;
  }
  // Definitive rejection only: the grant is dead (rotated-away, reused-family,
  // revoked, expired). Anything else (429, 5xx, misroute) is transient — the
  // session may still be valid, so it must never trigger a logout.
  if (response.status === 400 || response.status === 401 || response.status === 403) {
    return null;
  }
  throw new TransientAuthError(`Authentication service returned ${response.status}`);
}

interface AuthMeResponse {
  account?: { id?: string; email?: string; display_name?: string | null };
}

async function fetchAccount(accessToken: string): Promise<SessionAccount | null> {
  try {
    const info = await fetch(`${authBase}/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    });
    if (!info.ok) {
      return null;
    }
    const payload = (await info.json()) as AuthMeResponse;
    if (!payload?.account?.id) {
      return null;
    }
    return {
      id: payload.account.id,
      email: payload.account.email ?? null,
      name: payload.account.display_name ?? null,
    };
  } catch {
    // userinfo is best-effort — the token itself proves the session.
    return null;
  }
}

async function applyTokens(tokens: TokenResponse): Promise<void> {
  if (tokens.refresh_token) {
    sessionStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  }
  if (tokens.id_token) {
    sessionStorage.setItem(ID_TOKEN_KEY, tokens.id_token);
  }
  scheduleProactiveRefresh(tokens.expires_in);
  const account = await fetchAccount(tokens.access_token);
  useSessionStore.getState().setSession(tokens.access_token, account);
}

let refreshInFlight: Promise<string | null> | null = null;

/** Single-flight refresh: fresh access token, null when the session is dead
 *  (cleared + broadcast), or THROWS TransientAuthError when the endpoint is
 *  unreachable/failing transiently — the session is kept in that case. */
export async function refreshTokens(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    const refreshToken = sessionStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      return null;
    }
    let tokens: TokenResponse | null;
    try {
      tokens = await tokenGrant({ grant_type: 'refresh_token', refresh_token: refreshToken });
    } catch (err) {
      if (err instanceof TransientAuthError) {
        // Offline / engine blip with a live in-memory session: retry once
        // shortly so recovery doesn't wait for the next user-initiated call.
        // Cold-load callers (status unknown) fall through to silent re-auth
        // instead, so no timer is scheduled for them.
        if (useSessionStore.getState().status === 'authenticated') {
          stopProactiveRefresh();
          refreshTimer = setTimeout(() => {
            void refreshTokens().catch(() => undefined);
          }, 30_000);
        }
      }
      throw err;
    }
    if (!tokens) {
      // Refresh rejected (rotated-away, reused-family, revoked, expired) —
      // the session is dead everywhere; broadcast so all tabs drop it.
      useSessionStore.getState().clear();
      return null;
    }
    await applyTokens(tokens);
    return tokens.access_token;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

let hydrateInFlight: Promise<void> | null = null;

/**
 * Cold-load restore: refresh token → silent OP re-auth → anonymous.
 * Concurrent callers share the one attempt.
 */
async function hydrateSession(): Promise<void> {
  if (hydrateInFlight) {
    return hydrateInFlight;
  }
  hydrateInFlight = (async () => {
    registerTabSync();
    if (useSessionStore.getState().accessToken) {
      return;
    }
    if (sessionStorage.getItem(REFRESH_KEY)) {
      // A transient failure here (offline/engine blip) is not session death —
      // fall through to silent re-auth before giving up.
      let fresh: string | null = null;
      try {
        fresh = await refreshTokens();
      } catch {
        fresh = null;
      }
      if (fresh && useSessionStore.getState().accessToken) {
        return;
      }
      // Refresh failed but the OP cookie session may still be alive (e.g.
      // rotation state lost) — fall through to silent re-auth before giving up.
    }
    const silent = await attemptSilentAuth().catch(() => false);
    if (silent && useSessionStore.getState().accessToken) {
      return;
    }
    useSessionStore.setState({ status: 'anonymous' });
  })().finally(() => {
    hydrateInFlight = null;
  });
  return hydrateInFlight;
}

// ── The authorization_code + PKCE flow ──────────────────────────────────────

interface AuthorizeParams {
  prompt?: 'none';
  /**
   * Preselected upstream provider (a key from GET /login/providers, e.g.
   * 'google'). The OP honors it only when it names a provider enabled on
   * this deployment — otherwise the generic interaction page renders.
   * A UI hint, not an auth decision: the OP allowlists it server-side.
   */
  connection?: string;
}

/** Begin login: full-page redirect to the OP authorize endpoint. */
export async function beginLogin(returnTo?: string, params?: AuthorizeParams): Promise<void> {
  const fallback = window.location.pathname + window.location.search;
  const target = returnTo ?? fallback;
  sessionStorage.setItem(RETURN_KEY, isSafeReturnPath(target) ? target : '/platform');
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  sessionStorage.setItem(PKCE_KEY, verifier);
  const challenge = base64url(await sha256(verifier));
  const state = base64url(crypto.getRandomValues(new Uint8Array(16)));
  sessionStorage.setItem(STATE_KEY, state);
  const redirectUri = `${window.location.origin}${CALLBACK_PATH}`;
  const query = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  if (params?.prompt) {
    query.set('prompt', params.prompt);
  }
  if (params?.connection && params.connection.trim().length > 0) {
    query.set('connection', params.connection.trim());
  }
  window.location.assign(`${authBase}/auth?${query.toString()}`);
}

/**
 * Shared code/state → token exchange for both top-level and silent callbacks.
 * Each flow passes its own storage keys (interactive vs silent) so a late
 * background exchange can never consume or invalidate the other flow's
 * state — that cross-flow wipe was the "Login state mismatch" bug.
 */
async function exchangeCode(
  code: string,
  state: string,
  opts?: { consumeReturn?: boolean; stateKey?: string; pkceKey?: string },
): Promise<string> {
  const stateKey = opts?.stateKey ?? STATE_KEY;
  const pkceKey = opts?.pkceKey ?? PKCE_KEY;
  const expectedState = sessionStorage.getItem(stateKey);
  sessionStorage.removeItem(stateKey);
  if (!state || state !== expectedState) {
    throw new Error('Login state mismatch — please try signing in again.');
  }
  const verifier = sessionStorage.getItem(pkceKey);
  sessionStorage.removeItem(pkceKey);
  if (!verifier) {
    throw new Error('Login session lost — please try signing in again.');
  }
  let tokens: TokenResponse | null;
  try {
    tokens = await tokenGrant({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: `${window.location.origin}${CALLBACK_PATH}`,
    });
  } catch (err) {
    // Offline mid-exchange: PKCE/state are already consumed (single-use), so
    // the user retries the login — but the session is untouched.
    if (err instanceof TransientAuthError) {
      throw new Error('Cannot reach the sign-in service — check your connection and try again.');
    }
    throw err;
  }
  if (!tokens) {
    throw new Error('Login exchange failed — please try again.');
  }
  await applyTokens(tokens);
  if (opts?.consumeReturn === false) {
    // Silent-renew context: the return path belongs to a pending interactive
    // login (if any) and must survive this background exchange.
    return '/platform';
  }
  const target = sessionStorage.getItem(RETURN_KEY) ?? '/platform';
  sessionStorage.removeItem(RETURN_KEY);
  return isSafeReturnPath(target) ? target : '/platform';
}

/** Callback exchange: ?code&state → tokens → session. Returns the post-login return path. */
export async function handleAuthCallback(search: string): Promise<string> {
  const params = new URLSearchParams(search);
  const code = params.get('code');
  if (!code) {
    throw new Error(params.get('error_description') ?? params.get('error') ?? 'Login failed');
  }
  return exchangeCode(code, params.get('state') ?? '');
}

interface SilentResult {
  type?: unknown;
  code?: string;
  state?: string;
  error?: string;
}

/** The iframe callback page tags its postMessage — any other same-origin message is not a grant. */
const SILENT_MESSAGE_TYPE = 'neryva:silent-auth';

/**
 * Cross-restart persistence without persisted secrets: a hidden iframe runs
 * `prompt=none` against the first-party OP cookie session. The callback page,
 * loaded inside the iframe, postMessages the code back (same-origin) instead
 * of navigating. Resolves true when tokens were restored.
 */
export async function attemptSilentAuth(): Promise<boolean> {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false;
  }
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  sessionStorage.setItem(SILENT_PKCE_KEY, verifier);
  const challenge = base64url(await sha256(verifier));
  const state = base64url(crypto.getRandomValues(new Uint8Array(16)));
  sessionStorage.setItem(SILENT_STATE_KEY, state);
  const redirectUri = `${window.location.origin}${CALLBACK_PATH}`;
  const query = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'none',
  });

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      window.removeEventListener('message', onMessage);
      iframe.remove();
      if (!ok) {
        // Clean up only this flow's keys. The interactive login's keys live
        // under different names now, so a late silent failure can no longer
        // wipe an in-flight "Continue with email" attempt.
        sessionStorage.removeItem(SILENT_PKCE_KEY);
        sessionStorage.removeItem(SILENT_STATE_KEY);
      }
      resolve(ok);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const data = event.data as SilentResult | null;
      if (!data || typeof data !== 'object' || data.type !== SILENT_MESSAGE_TYPE) {
        return;
      }
      if (!('code' in data || 'error' in data)) {
        return;
      }
      if (data.error || !data.code) {
        done(false);
        return;
      }
      exchangeCode(data.code, data.state ?? '', {
        consumeReturn: false,
        stateKey: SILENT_STATE_KEY,
        pkceKey: SILENT_PKCE_KEY,
      })
        .then(() => done(true))
        .catch(() => done(false));
    };
    window.addEventListener('message', onMessage);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('tabindex', '-1');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden;';
    iframe.src = `${authBase}/auth?${query.toString()}`;
    document.body.appendChild(iframe);
    window.setTimeout(() => done(false), SILENT_TIMEOUT_MS);
  });
}

/**
 * End the session: revoke server-side sessions (best-effort), clear locally
 * with logout-everywhere broadcast, then end the OP session.
 */
export async function logout(): Promise<void> {
  const accessToken = useSessionStore.getState().accessToken;
  if (accessToken) {
    try {
      // No content-type: Fastify 400s on `content-type: application/json`
      // with an empty body, which silently broke server-side revocation.
      await fetch(`${authBase}/me/sessions/revoke-all`, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
    } catch {
      /* best-effort — the OP end_session below still runs */
    }
  }
  const idToken = sessionStorage.getItem(ID_TOKEN_KEY);
  useSessionStore.getState().clear();
  const params = new URLSearchParams({ post_logout_redirect_uri: window.location.origin });
  if (idToken) {
    params.set('id_token_hint', idToken);
    sessionStorage.removeItem(ID_TOKEN_KEY);
  }
  window.location.assign(`${authBase}/session/end?${params.toString()}`);
}

// Bind the API client to this session layer.
bindTokenSource({
  getAccessToken: () => useSessionStore.getState().accessToken,
  refresh: () => refreshTokens(),
  onFatalAuth: () => {
    useSessionStore.getState().clear();
    // Dead session → the branded sign-in page, never the raw OP. The
    // current path rides along as ?return= so the user lands back where
    // they were after signing in (validated by isSafeReturnPath there).
    const here = window.location.pathname + window.location.search;
    const onAuthSurface = here.startsWith('/auth') || here.startsWith('/platform/auth/callback');
    window.location.assign(onAuthSurface ? '/auth' : `/auth?return=${encodeURIComponent(here)}`);
  },
});
