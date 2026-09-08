/**
 * URL-synced state (F-9): the one convention for filters, search, tabs,
 * pagination, and date ranges in wired views — every such control lives in
 * the URL, so views are shareable and back/forward behaves.
 *
 * `''` (or the declared default) removes the key from the URL — clean
 * addresses, no `?q=` noise. Updates use `replace: true`: changing a filter
 * is not a navigation the user should have to undo step by step.
 */
import { useCallback } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

/** All current search params (strings only — callers serialize their types). */
export function useUrlSearchParams(): Record<string, string | undefined> {
  return useSearch({ strict: false }) as Record<string, string | undefined>;
}

export function useUrlState(
  key: string,
  options?: { default?: string },
): [string, (next: string | ((prev: string) => string)) => void] {
  const search = useUrlSearchParams();
  const navigate = useNavigate();
  const fallback = options?.default ?? '';
  const value = search[key] ?? fallback;

  const set = useCallback(
    (next: string | ((prev: string) => string)) => {
      const resolved = typeof next === 'function' ? next(search[key] ?? fallback) : next;
      const updated: Record<string, string> = {};
      for (const [k, v] of Object.entries(search)) {
        if (typeof v === 'string' && v !== '' && k !== key) {
          updated[k] = v;
        }
      }
      if (resolved !== '' && resolved !== fallback) {
        updated[key] = resolved;
      }
      // Reducer form: TanStack's search slot wants an updater; we replace
      // wholesale from the snapshot we just read (no stale-key leakage).
      // The route tree declares no per-route search schemas yet, so its
      // inference collapses to `never` — this helper is the typed surface
      // for search params, hence the contained cast.
      void navigate({ search: (() => updated) as never, replace: true });
    },
    [key, fallback, search, navigate],
  );

  return [value, set];
}
