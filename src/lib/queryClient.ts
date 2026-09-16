/**
 * The shared TanStack Query client (single instance for the app).
 *
 * Conventions (frontend_implementation_plan §6 — no exceptions):
 *  - React Query owns server state; zustand owns session/org/UI prefs only.
 *  - Query keys always start `['org', orgId, …]` for org-scoped data so an
 *    org switch invalidates with one prefix; `['auth', …]` for the
 *    session/account domain; `['meta', …]` for deployment-scoped publics.
 *  - `staleTime` 5min baseline; ~15s for run/approval queues, `no-cache`
 *    for audit-verify (set per hook).
 *  - Retry transient failures only (5xx/network), never 4xx.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status;
        if (typeof status === 'number') {
          return status >= 500 && failureCount < 2;
        }
        return failureCount < 2; // network/unknown → bounded retry
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
});

/** Drop every org-scoped query — call after the active org changes. */
export function invalidateOrgScope(): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: ['org'] }).then(() => undefined);
}

/** Drop session-domain queries — call after sign-in, sign-out, or account change. */
export function invalidateAuthScope(): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: ['auth'] }).then(() => undefined);
}
