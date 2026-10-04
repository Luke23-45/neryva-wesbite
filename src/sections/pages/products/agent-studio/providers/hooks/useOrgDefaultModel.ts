/**
 * useOrgDefaultModel — react-query wrapper over the org default-model read.
 *
 * GET /console/org/:orgId/models/default → { default: { provider, model_id } | null }
 *
 * The Models page (DEFAULT column) owns the write; the guided agent-setup
 * flow is the only consumer — it pre-selects the default as a normal,
 * changeable pipeline entry. A null default, a failed fetch, or a default
 * that matches no available row all read as "no default" (the hook surfaces
 * the query state and callers fall back to existing behavior — never a
 * fabricated selection).
 */
import { useQuery } from '@tanstack/react-query';
import { useOrg } from '@/Context/OrgContext';
import { fetchModelDefault, type OrgDefaultModel } from '../api';

export type { OrgDefaultModel };

export const orgDefaultModelKey = (orgId: string) =>
  ['org', orgId, 'models', 'default'] as const;

export function useOrgDefaultModel(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  const enabled = (options?.enabled ?? true) && !!orgId;
  return useQuery({
    queryKey: orgId ? orgDefaultModelKey(orgId) : ['org', 'models', 'default', 'disabled'],
    queryFn: () => fetchModelDefault(orgId as string),
    enabled,
    staleTime: 60_000,
    // Retry follows the app QueryClient convention (transient failures only,
    // bounded) — a hard failure lands in isError and the setup flow falls
    // back to the existing empty-pipeline behavior.
  });
}
