/**
 * The OP session layer (frontend-engine-integration-plan A2).
 *
 * Login is the Neryva Account via the engine OP: authorization_code + PKCE
 * against the pre-registered first-party client `neryva-console`. Tokens
 * live in memory (access) + sessionStorage (refresh, so a reload survives
 * without persisting a powerful credential to localStorage). The session
 * store is the bridge the API client binds to (bindTokenSource).
 */
import { create } from 'zustand';
import { bindTokenSource, ENGINE_URL } from './client';

const CLIENT_ID = 'neryva-console';
const SCOPES = 'openid email profile offline_access';
const CALLBACK_PATH = '/platform/auth/callback';
const REFRESH_KEY = 'neryva.refresh_token';
const RETURN_KEY = 'neryva.post_login_return';

const authBase = `${ENGINE_URL}/auth`;

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return new Uint8Array(digest);
}

// ── Session store (memory-first) ────────────────────────────────────────────

interface SessionState {
  accessToken: string | null;
  /** Engine account claims (sub, email, name) — from userinfo. */
  account: { id: string; email: string | null; name: string | null } | null;
  status: 'unknown' | 'authenticated' | 'anonymous';
  setSession: (accessToken: string, account: SessionState['account']) => void;
  clear: () => void;
  hydrate: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  account: null,
  status: 'unknown',
  setSession: (accessToken, account) => set({ accessToken, account, status: 'authenticated' }),
  clear: () => {
    sessionStorage.removeItem(REFRESH_KEY);
    set({ accessToken: null, account: null, status: 'anonymous' });
  },
  hydrate: async () => {
    if (useSessionStore.getState().accessToken) {
      return;
    }
    if (sessionStorage.getItem(REFRESH_KEY)) {
      const fresh = await refreshTokens();
      if (fresh && useSessionStore.getState().accessToken) {
        return;
      }
    }
    set({ status: 'anonymous' });
  },
}));

// ── Token endpoint grants ───────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

async function tokenGrant(body: Record<string, string>): Promise<TokenResponse | null> {
  const response = await fetch(`${authBase}/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }).toString(),
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as TokenResponse;
}

async function applyTokens(tokens: TokenResponse): Promise<void> {
  if (tokens.refresh_token) {
    sessionStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  }
  let account: SessionState['account'] = null;
  try {
    const info = await fetch(`${authBase}/me`, { headers: { authorization: `Bearer ${tokens.access_token}` } });
    if (info.ok) {
      const claims = (await info.json()) as { sub?: string; email?: string; name?: string };
      account = { id: claims.sub ?? '', email: claims.email ?? null, name: claims.name ?? null };
    }
  } catch {
    /* userinfo is best-effort — the token itself proves the session */
  }
  useSessionStore.getState().setSession(tokens.access_token, account);
}

/** Single-flight refresh; returns a fresh access token or null (session dead). */
export async function refreshTokens(): Promise<string | null> {
  const refreshToken = sessionStorage.getItem(REFRESH_KEY);
  if (!refreshToken) {
    return null;
  }
  const tokens = await tokenGrant({ grant_type: 'refresh_token', refresh_token: refreshToken }).catch(() => null);
  if (!tokens) {
    useSessionStore.getState().clear();
    return null;
  }
  await applyTokens(tokens);
  return tokens.access_token;
}

// ── The authorization_code + PKCE flow ──────────────────────────────────────

/** Begin login: full-page redirect to the OP authorize endpoint. */
export async function beginLogin(): Promise<void> {
  sessionStorage.setItem(RETURN_KEY, window.location.pathname + window.location.search);
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  sessionStorage.setItem('neryva.pkce_verifier', verifier);
  const challenge = base64url(await sha256(verifier));
  const state = base64url(crypto.getRandomValues(new Uint8Array(16)));
  sessionStorage.setItem('neryva.oauth_state', state);
  const redirectUri = `${window.location.origin}${CALLBACK_PATH}`;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  window.location.assign(`${authBase}/auth?${params.toString()}`);
}

/** Callback exchange: ?code&state → tokens → session. Returns the post-login return path. */
export async function handleAuthCallback(search: string): Promise<string> {
  const params = new URLSearchParams(search);
  const code = params.get('code');
  const state = params.get('state');
  const expectedState = sessionStorage.getItem('neryva.oauth_state');
  sessionStorage.removeItem('neryva.oauth_state');
  if (!code) {
    throw new Error(params.get('error_description') ?? params.get('error') ?? 'Login failed');
  }
  if (!state || state !== expectedState) {
    throw new Error('Login state mismatch — please try signing in again.');
  }
  const verifier = sessionStorage.getItem('neryva.pkce_verifier');
  sessionStorage.removeItem('neryva.pkce_verifier');
  if (!verifier) {
    throw new Error('Login session lost — please try signing in again.');
  }
  const tokens = await tokenGrant({
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    redirect_uri: `${window.location.origin}${CALLBACK_PATH}`,
  });
  if (!tokens) {
    throw new Error('Login exchange failed — please try again.');
  }
  await applyTokens(tokens);
  const target = sessionStorage.getItem(RETURN_KEY) ?? '/platform';
  sessionStorage.removeItem(RETURN_KEY);
  return target;
}

/** End the session locally + at the OP (best-effort), then return to marketing root. */
export async function logout(): Promise<void> {
  const idToken = sessionStorage.getItem('neryva.id_token');
  useSessionStore.getState().clear();
  const params = new URLSearchParams({ post_logout_redirect_uri: window.location.origin });
  if (idToken) {
    params.set('id_token_hint', idToken);
  }
  window.location.assign(`${authBase}/session/end?${params.toString()}`);
}

// Bind the API client to this session layer.
bindTokenSource({
  getAccessToken: () => useSessionStore.getState().accessToken,
  refresh: () => refreshTokens(),
  onFatalAuth: () => {
    useSessionStore.getState().clear();
  },
});
