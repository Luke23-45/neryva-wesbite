/**
 * useGroupedModels — react-query wrapper over the Providers Models tab
 * read (N-5) + toggle write (N-6).
 *
 * - `useGroupedModels(orgId)` — `GET /console/org/:orgId/models/grouped`,
 *   keyed `['org', orgId, 'models', 'grouped']` (the org-scope prefix the
 *   OrgContext invalidation comment relies on).
 * - `useModelToggles(orgId)` — `POST /console/org/:orgId/models/toggles`
 *   with optimistic update + rollback. Every write is audited server-side
 *   (engine setModelToggles, actor + timestamp); the client never invents
 *   audit records.
 *
 * Optimistic semantics: the mutation flips `enabled` on the exact rows the
 * toggle addresses — matched on (supergroup, provider, credential, model_id)
 * — so the same model id served by Platform Managed AND a BYOK key is two
 * distinct rows and only the addressed one flips. On error the previous
 * cache entry is restored verbatim; on settle the query refetches.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchGroupedModels,
  postModelToggles,
  type ModelGroupView,
  type ModelToggleInput,
  type Supergroup,
} from '../api';

export interface GroupedModels {
  platform: ModelGroupView[];
  byok: ModelGroupView[];
}

export const groupedModelsKey = (orgId: string) =>
  ['org', orgId, 'models', 'grouped'] as const;

/**
 * Nil-UUID sentinel the engine uses for platform rows
 * (`org_model_toggles.credential_id` PK, NULL forbidden — doc 19 §12).
 */
export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

function credentialMatches(group: ModelGroupView, t: ModelToggleInput): boolean {
  if (t.supergroup === 'byok') {
    // BYOK rows address a specific credential — the api contract ships the
    // real UUID; undefined only if the caller forgot it (never for BYOK).
    return (group.credential_id ?? null) === (t.credential_id ?? null);
  }
  // Platform rows: api contract says callers pass credential_id undefined for
  // platform (the engine applies the nil sentinel). Never match a platform
  // row against a BYOK toggle or vice versa.
  return true;
}

/**
 * Pure optimistic reducer — exported for tests. Applies each toggle to the
 * rows it addresses without touching anything else.
 */
export function applyToggles(data: GroupedModels, toggles: ModelToggleInput[]): GroupedModels {
  const apply = (groups: ModelGroupView[], supergroup: Supergroup): ModelGroupView[] =>
    groups.map((group) => {
      const hits = toggles.filter(
        (t) => t.supergroup === supergroup && t.provider === group.provider && credentialMatches(group, t),
      );
      if (hits.length === 0) return group;
      const byModel = new Map(hits.map((h) => [h.model_id, h.enabled]));
      return {
        ...group,
        models: group.models.map((m) =>
          byModel.has(m.model_id) ? { ...m, enabled: byModel.get(m.model_id) === true } : m,
        ),
      };
    });
  return {
    platform: apply(data.platform, 'platform'),
    byok: apply(data.byok, 'byok'),
  };
}

export function useGroupedModels(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? groupedModelsKey(orgId) : ['org', 'models', 'grouped', 'disabled'],
    queryFn: () => fetchGroupedModels(orgId as string),
    enabled: orgId !== null && orgId !== '',
  });
}

export function useModelToggles(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (toggles: ModelToggleInput[]) => {
      if (orgId === null || orgId === '') throw new Error('orgId is required');
      return postModelToggles(orgId, toggles);
    },
    onMutate: async (toggles) => {
      if (orgId === null || orgId === '') return { prev: undefined as GroupedModels | undefined };
      await queryClient.cancelQueries({ queryKey: groupedModelsKey(orgId) });
      const prev = queryClient.getQueryData<GroupedModels>(groupedModelsKey(orgId));
      if (prev) {
        queryClient.setQueryData<GroupedModels>(groupedModelsKey(orgId), applyToggles(prev, toggles));
      }
      return { prev };
    },
    onError: (_error, _variables, context) => {
      if (orgId === null || orgId === '' || !context?.prev) return;
      queryClient.setQueryData<GroupedModels>(groupedModelsKey(orgId), context.prev);
    },
    onSettled: () => {
      if (orgId === null || orgId === '') return;
      void queryClient.invalidateQueries({ queryKey: groupedModelsKey(orgId) });
    },
  });
}
