/**
 * The engine API client (frontend-engine-integration-plan A1).
 *
 * One fetch wrapper for every engine call:
 *  - Bearer access token from the OP session (memory-first; refresh on 401
 *    with a single-flight queue)
 *  - `X-Neryva-Org` injected from the active-org context on org-scoped calls
 *  - `Idempotency-Key` auto-generated for mutations that declare it
 *  - `X-MFA-Proof` pass-through for step-up-gated acts
 *  - the engine error envelope `{error:{code,message,details,request_id}}`
 *    parsed into a typed ApiError (machine codes drive the UI: step_up_required,
 *    entitlement_required, past_due, rate_limited, …)
 */

/**
 * The engine base for every request. Dev routes through the Vite proxy
 * (fully same-origin — OP cookies first-party, no CORS); production is
 * same-origin via the edge, so BASE is '' there too. VITE_ENGINE_URL is
 * only for non-standard topologies (e.g. a separate engine domain with
 * CORS deliberately opened).
 */
export const ENGINE_BASE: string = import.meta.env.DEV && !import.meta.env.VITE_ENGINE_URL
  ? '/engine'
  : (import.meta.env.VITE_ENGINE_URL as string | undefined ?? '').replace(/\/$/, '');

export type EngineErrorCode =
  | 'unauthenticated'
  | 'denied_by_default'
  | 'forbidden'
  | 'entitlement_required'
  | 'past_due'
  | 'step_up_required'
  | 'not_found'
  | 'validation_failed'
  | 'rate_limited'
  | 'idempotency_in_flight'
  | 'idempotency_conflict'
  | 'conflict'
  | 'internal_error'
  | 'service_unavailable'
  | 'network_error';

export class ApiError extends Error {
  readonly status: number;
  readonly code: EngineErrorCode;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;

  constructor(status: number, code: EngineErrorCode, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    const retry = (details as { retry_after_seconds?: number } | undefined)?.retry_after_seconds;
    this.retryAfterSeconds = typeof retry === 'number' ? retry : undefined;
  }
}

/** Token supplier + 401 refresher — wired by the session layer (auth.ts). */
export interface TokenSource {
  getAccessToken(): string | null;
  refresh(): Promise<string | null>;
  onFatalAuth?(): void;
}
let tokenSource: TokenSource | null = null;
export function bindTokenSource(source: TokenSource): void {
  tokenSource = source;
}

/**
 * The current Authorization header value — for transports that bypass
 * `engine()` and can't use the fetch-wrapper auth path (fetch-based SSE).
 * Returns null when signed out; callers decide what that means for them.
 */
export function authorizationHeader(): string | null {
  const token = tokenSource?.getAccessToken();
  return token ? `Bearer ${token}` : null;
}

/** Org scope — set by OrgProvider; undefined on unscoped calls. */
let activeOrgId: string | null = null;
export function setActiveOrg(orgId: string | null): void {
  activeOrgId = orgId;
}

export interface EngineRequestInit {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Generate an Idempotency-Key (engine stores the response for replays). */
  idempotent?: boolean;
  /** Step-up MFA proof (privileged acts: role→owner/admin, transfer, deletion, key issue). */
  mfaProof?: string;
  /** Override the org header explicitly (e.g. a different org's scoped call). */
  orgId?: string | null;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: EngineRequestInit['query']): string {
  const url = new URL(`${ENGINE_BASE}${path.startsWith('/') ? path : `/${path}`}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function randomIdempotencyKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function parseError(response: Response): Promise<ApiError> {
  let code: EngineErrorCode = response.status === 401 ? 'unauthenticated' : response.status >= 500 ? 'internal_error' : 'internal_error';
  let message = response.statusText || 'Engine request failed';
  let details: unknown;
  let requestId: string | undefined;
  try {
    const payload = (await response.json()) as { error?: { code?: string; message?: string; details?: unknown; request_id?: string } };
    if (payload?.error) {
      code = (payload.error.code as EngineErrorCode) ?? code;
      message = payload.error.message ?? message;
      details = payload.error.details;
      requestId = payload.error.request_id;
    }
  } catch {
    /* non-JSON body — keep the status-derived defaults */
  }
  return new ApiError(response.status, code, message, details, requestId);
}

let refreshInFlight: Promise<string | null> | null = null;

async function execute<T>(path: string, init: EngineRequestInit, retryOn401: boolean): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (init.body !== undefined) {
    headers['content-type'] = 'application/json';
  }
  const token = tokenSource?.getAccessToken();
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  const orgId = init.orgId !== undefined ? init.orgId : activeOrgId;
  if (orgId) {
    headers['x-neryva-org'] = orgId;
  }
  if (init.idempotent) {
    headers['idempotency-key'] = randomIdempotencyKey();
  }
  if (init.mfaProof) {
    headers['x-mfa-proof'] = init.mfaProof;
  }

  const response = await fetch(buildUrl(path, init.query), {
    method: init.method ?? 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    credentials: 'include',
    signal: init.signal,
  });

  if (response.status === 401 && retryOn401 && tokenSource) {
    if (!refreshInFlight) {
      refreshInFlight = tokenSource.refresh().finally(() => {
        refreshInFlight = null;
      });
    }
    const fresh = await refreshInFlight;
    if (fresh) {
      return execute<T>(path, init, false);
    }
    tokenSource.onFatalAuth?.();
    throw await parseError(response);
  }

  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** The one entry point every hook uses. Network failures become ApiError('network_error'). */
export async function engine<T>(path: string, init: EngineRequestInit = {}): Promise<T> {
  try {
    return await execute<T>(path, init, true);
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    throw new ApiError(0, 'network_error', 'Cannot reach the Neryva engine — check your connection and try again.');
  }
}

/** Authenticated download (audit CSV/JSON export, org export): fetch → blob → save. */
export async function engineDownload(path: string, query?: EngineRequestInit['query']): Promise<void> {
  const headers: Record<string, string> = {};
  const token = tokenSource?.getAccessToken();
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  if (activeOrgId) {
    headers['x-neryva-org'] = activeOrgId;
  }
  const response = await fetch(buildUrl(path, query), { headers, credentials: 'include' });
  if (!response.ok) {
    throw await parseError(response);
  }
  const disposition = response.headers.get('content-disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = match?.[1] ?? 'neryva-export';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
