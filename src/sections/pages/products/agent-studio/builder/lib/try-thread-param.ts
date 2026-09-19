/**
 * C13 try-thread pointer (`?try=<conversationId>`) — the thread persists
 * engine-side; this param is only the pointer. Both Try surfaces share it
 * (path-scoped: builder and detail live on different routes).
 */

const PARAM = 'try';

export function readTryParam(): string | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(PARAM);
  return value !== null && value.trim() !== '' ? value : null;
}

export function writeTryParam(conversationId: string | null): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (conversationId) {
    if (params.get(PARAM) === conversationId) return;
    params.set(PARAM, conversationId);
  } else {
    if (!params.has(PARAM)) return;
    params.delete(PARAM);
  }
  const query = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

/** Drops the thread pointer — version switches start a fresh thread. */
export function resetTryParam(): void {
  writeTryParam(null);
}
