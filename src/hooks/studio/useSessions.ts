/**
 * Active sessions (ledger T-3) — GET /auth/me/sessions with per-session
 * and revoke-all. Org-independent; keyed ['studio','sessions'].
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';

export interface SessionRow {
  id: string;
  current: boolean;
  /** Device/client label — falls back to a trimmed user-agent. */
  label: string;
  /** Secondary metadata (location · last active). */
  meta: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseSessions(raw: unknown): SessionRow[] {
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
      const id = str(item.id) ?? str(item.session_id);
      if (!id) {
        return null;
      }
      const userAgent = str(item.user_agent) ?? str(item.userAgent);
      const label = str(item.device) ?? str(item.client) ?? str(item.client_name) ?? (userAgent ? userAgent.split('(')[0].trim() : null) ?? 'Unknown device';
      const place = str(item.location) ?? str(item.ip);
      const lastActive = str(item.last_active_at) ?? str(item.last_used_at) ?? str(item.created_at);
      const meta = [place, lastActive].filter((v): v is string => v !== null).join(' · ') || null;
      return {
        id,
        current: item.current === true || item.is_current === true,
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
    select: parseSessions,
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
