/**
 * Active sessions (ledger T-3) — GET /auth/me/sessions with per-session
 * and revoke-all. Org-independent; keyed ['studio','sessions'].
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { useSessionStore } from '@lib/engine/auth';
import { toastEngineError } from '@lib/engine/errors';

export interface SessionRow {
  id: string;
  /** True when the row's session_uid matches the `sid` claim of our own access token. */
  current: boolean;
  /** Device/client label — falls back to a trimmed user-agent. */
  label: string;
  /** Secondary metadata (location · last active). */
  meta: string | null;
}

/**
 * D-1: the engine returns rows as {sid, client_id, device, created_at,
 * last_seen_at, revoked} — NOT {id/session_id}. The old parser read only
 * id/session_id, so every row was dropped and the list was permanently
 * empty. `device` is an object, not a string. Revoked rows are excluded
 * (the engine also filters them — D-3 — this is belt and braces).
 */
function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/** The engine sends `device` as an object (e.g. {}); extract a label if it carries one. */
function deviceLabel(device: unknown): string | null {
  if (typeof device !== 'object' || device === null) {
    return str(device);
  }
  const d = device as Record<string, unknown>;
  return (
    str(d.label) ??
    str(d.name) ??
    str(d.model) ??
    ([str(d.os), str(d.browser)].filter((v): v is string => v !== null).join(' · ') || null)
  );
}

/**
 * P7 D-2: the engine mints access tokens with a `sid` claim carrying the
 * OIDC session.uid. The session list rows carry the same value as
 * `session_uid`, so the UI can mark the current session without the engine
 * tracking per-client "current" state. Decoding the payload client-side is
 * safe: the signature was already verified by the engine on every request.
 */
function currentSessionUid(): string | null {
  try {
    const token = useSessionStore.getState().accessToken;
    if (!token) {
      return null;
    }
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const sid = (json as Record<string, unknown>).sid;
    return typeof sid === 'string' && sid.length > 0 ? sid : null;
  } catch {
    return null;
  }
}

export function parseSessions(raw: unknown, currentUid?: string | null): SessionRow[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw)
    ? raw
    : [record.sessions, record.active_sessions].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      // D-1: engine key is `sid`; keep the legacy fallbacks for shape drift.
      const id = str(item.sid) ?? str(item.id) ?? str(item.session_id);
      if (!id) {
        return null;
      }
      if (item.revoked === true) {
        return null;
      }
      const userAgent = str(item.user_agent) ?? str(item.userAgent);
      const label =
        deviceLabel(item.device) ??
        str(item.client) ??
        str(item.client_name) ??
        str(item.client_id) ??
        (userAgent ? userAgent.split('(')[0].trim() : null) ??
        'Unknown device';
      const place = str(item.location) ?? str(item.ip);
      const lastActive = str(item.last_seen_at) ?? str(item.lastSeenAt) ?? str(item.last_active_at) ?? str(item.last_used_at) ?? str(item.created_at);
      const meta = [place, lastActive].filter((v): v is string => v !== null).join(' · ') || null;
      return {
        id,
        // P7 D-2: mark current by matching the row's session_uid against the
        // `sid` claim of our own access token. Engine-sent flags stay as a
        // fallback for shape drift.
        current:
          (currentUid != null && str(item.session_uid) === currentUid) ||
          item.current === true ||
          item.is_current === true,
        label,
        meta,
      } satisfies SessionRow;
    })
    .filter((s): s is SessionRow => s !== null);
}

const SESSIONS_KEY = ['studio', 'sessions'] as const;

export function useSessions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...SESSIONS_KEY],
    queryFn: () => engine<unknown>('/auth/me/sessions'),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    select: (raw) => parseSessions(raw, currentSessionUid()),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) =>
      engine(`/auth/me/sessions/${sessionId}/revoke`, { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY] }),
    onError: (error) => toastEngineError(error, 'Could not revoke the session'),
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => engine('/auth/me/sessions/revoke-all', { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY] }),
    onError: (error) => toastEngineError(error, 'Could not revoke the sessions'),
  });
}
