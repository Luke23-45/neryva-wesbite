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
 * distinct rows and only the addressed one flips. `usable`/`reasons` move
 * with the flip (mirroring the engine derivation). On error only the
 * addressed rows roll back (per-row snapshots — a concurrent batch's
 * optimistic flips survive); on settle the query refetches.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchGroupedModels,
  postModelToggles,
  setModelDefault,
  type ModelGroupView,
  type ModelRowView,
  type ModelToggleInput,
  type OrgDefaultModel,
  type Supergroup,
} from '../api';
import { orgDefaultModelKey } from './useOrgDefaultModel';

// Re-export the N-5 view types so pages import from one module.
export type { ModelGroupView, ModelRowView, OrgDefaultModel, Supergroup };

/* ------------------------------------------------------------------ */
/* Pure display helpers (moved from the retired TabModels — the tab    */
/* system is gone, but the models page keeps the same vocabulary).      */
/* ------------------------------------------------------------------ */

/** Engine `reasons[]` codes rendered as human text (doc 19 §13).
 * Keys are the engine's real reason vocabulary: availability/N-5
 * (model-catalog.service.ts) and template compatibility
 * (templates.service.ts). Unknown codes fall back to the raw snake_case
 * words — never invented. */
export function humanizeReason(reason: string): string {
  const known: Record<string, string> = {
    // Availability / N-5 (model-catalog.service.ts)
    subscription_required:
      'Not covered by your current plan — upgrade your plan to enable this model.',
    provider_not_enabled:
      'The provider behind this row is not enabled for your organization.',
    residency_unknown:
      'The data region for this model is not confirmed, so it stays unavailable until the region is known.',
    residency_incompatible:
      'This model is not available in your organization\u2019s data residency region.',
    model_disabled_by_org:
      'Disabled for this organization — turn the switch on to make it available again.',
    provider_facts_unknown:
      'The provider status check failed, so this model stays unavailable until the check succeeds.',
    // Template compatibility (templates.service.ts)
    provider_credential_missing:
      'No verified provider credential is attached — connect a key before enabling.',
  };
  return known[reason] ?? reason.replace(/_/g, ' ');
}

export const CAPABILITY_LABELS = {
  tools: 'Tools',
  vision: 'Vision',
  reasoning: 'Reasoning',
  structured_output: 'Structured output',
} as const;

export function rowKey(
  supergroup: Supergroup,
  group: ModelGroupView,
  model: ModelRowView,
): string {
  return `${supergroup}:${group.credential_id ?? 'platform'}:${group.provider}:${model.model_id}`;
}

export interface GroupedModels {
  platform: ModelGroupView[];
  byok: ModelGroupView[];
  /** The org's default model for new assistants — null when unset. */
  default_model: OrgDefaultModel | null;
  /**
   * Per-read degradation codes (engine GROUPED_MODEL_DEGRADED_READS).
   * Empty when every sub-read succeeded — the page renders honest
   * per-section states for the codes present instead of a page-level 500.
   */
  degraded: string[];
}

/**
 * `128000` → `"128K"`, `200000` → `"200K"`, `1000000` → `"1M"`;
 * null/undefined/non-positive → `"—"`. Never invents a value.
 */
export function formatContextTokens(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1_000_000 && n % 1_000_000 === 0) return `${n / 1_000_000}M`;
  if (n >= 1_000 && n % 1_000 === 0) return `${n / 1_000}K`;
  return n.toLocaleString('en-US');
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
 * rows it addresses without touching anything else. `usable` and `reasons`
 * move with the flipped value — mirroring the engine's
 * `usable: enabled && row.usable` plus `model_disabled_by_org` derivation —
 * so the reason list never lags a round-trip behind the switch.
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
        models: group.models.map((m) => {
          if (!byModel.has(m.model_id)) return m;
          const nextEnabled = byModel.get(m.model_id) === true;
          const reasons = nextEnabled
            ? m.reasons.filter((r) => r !== 'model_disabled_by_org')
            : m.reasons.includes('model_disabled_by_org')
              ? m.reasons
              : [...m.reasons, 'model_disabled_by_org'];
          return { ...m, enabled: nextEnabled, usable: nextEnabled && reasons.length === 0, reasons };
        }),
      };
    });
  return {
    ...data,
    platform: apply(data.platform, 'platform'),
    byok: apply(data.byok, 'byok'),
  };
}

/**
 * Per-row rollback snapshots — exported for tests. Snapshots ONLY the rows
 * a toggle batch addresses, so two interleaved batches roll back
 * independently: restoring the whole query (the old behavior) let batch A's
 * rollback wipe batch B's optimistic flip.
 */
export function snapshotToggledRows(
  data: GroupedModels,
  toggles: ModelToggleInput[],
): Map<string, ModelRowView> {
  const prev = new Map<string, ModelRowView>();
  const collect = (groups: ModelGroupView[], supergroup: Supergroup) => {
    for (const group of groups) {
      const hits = toggles.filter(
        (t) => t.supergroup === supergroup && t.provider === group.provider && credentialMatches(group, t),
      );
      if (hits.length === 0) continue;
      const ids = new Set(hits.map((h) => h.model_id));
      for (const m of group.models) {
        if (ids.has(m.model_id)) prev.set(rowKey(supergroup, group, m), m);
      }
    }
  };
  collect(data.platform, 'platform');
  collect(data.byok, 'byok');
  return prev;
}

/** Restores exactly the rows a per-row snapshot captured; all others pass through. */
export function restoreToggledRows(
  data: GroupedModels,
  prev: Map<string, ModelRowView>,
): GroupedModels {
  if (prev.size === 0) return data;
  const restore = (groups: ModelGroupView[], supergroup: Supergroup): ModelGroupView[] =>
    groups.map((group) => ({
      ...group,
      models: group.models.map((m) => prev.get(rowKey(supergroup, group, m)) ?? m),
    }));
  return { ...data, platform: restore(data.platform, 'platform'), byok: restore(data.byok, 'byok') };
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
      if (orgId === null || orgId === '') return { prevRows: new Map<string, ModelRowView>() };
      await queryClient.cancelQueries({ queryKey: groupedModelsKey(orgId) });
      const prev = queryClient.getQueryData<GroupedModels>(groupedModelsKey(orgId));
      const prevRows = prev ? snapshotToggledRows(prev, toggles) : new Map<string, ModelRowView>();
      if (prev) {
        queryClient.setQueryData<GroupedModels>(groupedModelsKey(orgId), applyToggles(prev, toggles));
      }
      return { prevRows };
    },
    onError: (_error, _variables, context) => {
      if (orgId === null || orgId === '' || !context?.prevRows || context.prevRows.size === 0) return;
      // Per-row restore: only the rows this batch addressed revert — a
      // concurrent batch's optimistic flips survive.
      queryClient.setQueryData<GroupedModels>(groupedModelsKey(orgId), (data) =>
        data ? restoreToggledRows(data, context.prevRows) : data,
      );
    },
    onSettled: () => {
      if (orgId === null || orgId === '') return;
      void queryClient.invalidateQueries({ queryKey: groupedModelsKey(orgId) });
    },
  });
}

/**
 * useModelDefault — N-8 org default model write
 * (`PUT /console/org/:orgId/models/default`).
 *
 * Optimistic update flips the grouped query's `default_model` (the page
 * derives every radio's checked state from it) AND the standalone
 * `useOrgDefaultModel` read the guided setup flow consumes — the two
 * default-model truths reconcile at this single writer. On error both are
 * restored; on settle both refetch. The page owns the error copy (422 →
 * "not available for your organization").
 */
export function useModelDefault(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (def: OrgDefaultModel | null) => {
      if (orgId === null || orgId === '') throw new Error('orgId is required');
      return setModelDefault(orgId, def);
    },
    onMutate: async (def) => {
      if (orgId === null || orgId === '')
        return {
          prev: undefined as GroupedModels | undefined,
          prevDefault: undefined as { default: OrgDefaultModel | null } | undefined,
        };
      await queryClient.cancelQueries({ queryKey: groupedModelsKey(orgId) });
      const prev = queryClient.getQueryData<GroupedModels>(groupedModelsKey(orgId));
      const prevDefault = queryClient.getQueryData<{ default: OrgDefaultModel | null }>(
        orgDefaultModelKey(orgId),
      );
      if (prev) {
        queryClient.setQueryData<GroupedModels>(groupedModelsKey(orgId), {
          ...prev,
          default_model: def,
        });
      }
      queryClient.setQueryData(orgDefaultModelKey(orgId), { default: def });
      return { prev, prevDefault };
    },
    onError: (_error, _variables, context) => {
      if (orgId === null || orgId === '') return;
      if (context?.prev) queryClient.setQueryData<GroupedModels>(groupedModelsKey(orgId), context.prev);
      if (context?.prevDefault !== undefined)
        queryClient.setQueryData(orgDefaultModelKey(orgId), context.prevDefault);
    },
    onSettled: () => {
      if (orgId === null || orgId === '') return;
      void queryClient.invalidateQueries({ queryKey: groupedModelsKey(orgId) });
      void queryClient.invalidateQueries({ queryKey: orgDefaultModelKey(orgId) });
    },
  });
}
