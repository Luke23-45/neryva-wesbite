import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  fetchProviderDirectory,
  type OrgModelTier,
  type ProviderDirectoryCapability,
  type ProviderDirectoryEntry,
} from '../api';

export interface ProviderDirectoryFilters {
  /** Free-text search over names, models, tags (server-side). */
  search?: string;
  /** Tier pre-filter (server-side). */
  tier?: OrgModelTier;
  /** Capability pre-filter (server-side). */
  capability?: ProviderDirectoryCapability;
}

/**
 * Query-key prefix for the provider directory (N-4). The full key appends
 * the filter object; invalidating by this prefix clears every filter
 * variant (React Query matches by prefix).
 */
export const providerDirectoryKeyPrefix = (orgId: string) =>
  ['org', orgId, 'providers', 'directory'] as const;

/**
 * useProviderDirectory — react-query wrapper over N-4 `fetchProviderDirectory`.
 *
 * Thin by design: filtering beyond the query lives in the tab components so
 * the hook stays a faithful cache of the server response. Error copy is
 * sanitized at render time — never the raw engine message — so callers must
 * not surface `error.message` to users.
 */
export function useProviderDirectory(
  orgId: string | null,
  filters: ProviderDirectoryFilters = {},
): UseQueryResult<{ providers: ProviderDirectoryEntry[] }> {
  const search = filters.search?.trim() ? filters.search.trim() : undefined;
  const tier = filters.tier;
  const capability = filters.capability;

  return useQuery({
    queryKey: [
      ...providerDirectoryKeyPrefix(orgId as string),
      { search: search ?? '', tier: tier ?? '', capability: capability ?? '' },
    ],
    queryFn: () => fetchProviderDirectory(orgId as string, { search, tier, capability }),
    enabled: orgId !== null && orgId !== '',
    staleTime: 30_000,
    retry: 1,
  });
}
