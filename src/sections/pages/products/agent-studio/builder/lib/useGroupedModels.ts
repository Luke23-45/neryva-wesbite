/**
 * Builder grouped-models read (Phase 6, doc 20 §3.1 / PRV-075).
 *
 * Consumes the engine N-5 endpoint (`GET /console/org/:orgId/models/grouped`)
 * via the shared providers API seam — the engine-owned, fail-closed source:
 * unverified/failed/revoked credentials are omitted server-side, toggles are
 * consulted (`model_disabled_by_org`), capabilities are probed-wins, and every
 * row carries `pinned_by` for the blast-radius preview (PRV-077). The builder
 * never synthesizes BYOK rows client-side (that would duplicate the fail-closed
 * logic and could not produce pinned_by — Law VII).
 *
 * `credential_fingerprint` is deliberately dropped in the flatten: fingerprints
 * have no builder rendering (doc 20 §1.3) — key labels only.
 *
 * `contextWindowTokens` is display-only enrichment from the `/models`
 * availability read (same React Query key as `useModelAvailability`, so no
 * extra fetch). Absent = the engine didn't report it; the UI renders nothing
 * rather than guessing.
 */
import { useMemo } from 'react';
import { useOrg } from '@/Context/OrgContext';
import type { ModelGroupView, Supergroup } from '../../providers/api';
import { useGroupedModels as useProvidersGroupedModels } from '../../providers/hooks/useGroupedModels';
import { useModelAvailability } from '@hooks/studio/useSetupModels';
import { pipelineEntryKey } from './entry-key';

export type { Supergroup };

export interface BuilderModelRow {
  /** `byok|<ref>|<credentialId>` or `platform|<ref>|` — matches pipeline entry keys. */
  key: string;
  supergroup: Supergroup;
  provider: string;
  providerDisplayName: string;
  /** Null = platform pool (PRV-024). */
  credentialId: string | null;
  credentialLabel: string | null;
  modelId: string;
  /** Canonical `provider/model` reference. */
  ref: string;
  displayName: string;
  usable: boolean;
  /** From org_model_toggles; absent row = true. */
  enabled: boolean;
  reasons: string[];
  /** Probed-wins normalized vocabulary (engine). */
  capabilities: { tools: boolean; vision: boolean; reasoning: boolean; structured_output: boolean };
  requiredProduct: 'free' | 'payg' | 'enterprise' | null;
  /** Human label from the engine — never invented here. */
  requiredProductLabel: string | null;
  /** Catalog list prices, USD/1M strings — absent when unpriced. */
  pricing?: { input_per_1m?: string; output_per_1m?: string };
  /** PRV-035 — `operator_declared` prices are labeled in the picker (Law VII). */
  pricingSource?: 'catalog' | 'operator_declared';
  /** Assistants whose LIVE published pipeline pins this exact triple. IDs only —
   *  the engine does not return names; never fabricated. */
  pinnedBy: Array<{ assistant_id: string; version: number }>;
  /** Display-only enrichment from /models; null when the engine didn't report it. */
  contextWindowTokens: number | null;
}

interface GroupedModelsData {
  platform: ModelGroupView[];
  byok: ModelGroupView[];
}

function flattenGroup(
  supergroup: Supergroup,
  group: ModelGroupView,
  ctxByRef: Map<string, number | null>,
  out: BuilderModelRow[]
): void {
  const credentialId = group.credential_id ?? null;
  for (const m of group.models) {
    const ref = `${group.provider}/${m.model_id}`;
    out.push({
      key: pipelineEntryKey(ref, credentialId),
      supergroup,
      provider: group.provider,
      providerDisplayName: group.provider_display_name,
      credentialId,
      credentialLabel: group.credential_label ?? null,
      modelId: m.model_id,
      ref,
      displayName: m.display_name,
      usable: m.usable,
      enabled: m.enabled,
      reasons: [...m.reasons],
      capabilities: { ...m.capabilities },
      requiredProduct: m.required_product ?? null,
      requiredProductLabel: m.required_product_label ?? null,
      ...(m.pricing !== undefined ? { pricing: { ...m.pricing } } : {}),
      ...(m.pricing_source !== undefined ? { pricingSource: m.pricing_source } : {}),
      pinnedBy: m.pinned_by.map(p => ({ assistant_id: p.assistant_id, version: p.version })),
      contextWindowTokens: ctxByRef.get(ref) ?? null,
    });
  }
}

/** Flatten N-5 groups to picker rows. Exported for tests. */
export function flattenGroupedModels(
  data: GroupedModelsData,
  ctxByRef: Map<string, number | null> = new Map()
): BuilderModelRow[] {
  const out: BuilderModelRow[] = [];
  for (const group of data.platform) flattenGroup('platform', group, ctxByRef, out);
  for (const group of data.byok) flattenGroup('byok', group, ctxByRef, out);
  return out;
}

/**
 * N-5 grouped models for the builder, flattened to `BuilderModelRow[]`.
 *
 * Reads through the shared providers N-5 hook (same query cache as the
 * Providers page — toggle writes there reflect here), then flattens to the
 * builder row shape with context-window enrichment.
 */
export function useGroupedModels(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  const enabled = (options?.enabled ?? true) && !!orgId;
  // Shared N-5 cache with the Providers page (toggle optimistic updates
  // included) — the builder never fetches grouped models twice.
  const grouped = useProvidersGroupedModels(enabled ? orgId : null);
  // Same query key as useModelAvailability — React Query dedupes; this is
  // display-only context-window enrichment, not a second source of truth.
  const availability = useModelAvailability({ enabled });

  const data = useMemo(() => {
    if (!grouped.data) return undefined;
    const ctxByRef = new Map<string, number | null>();
    for (const row of availability.data ?? []) {
      ctxByRef.set(`${row.provider}/${row.modelId}`, row.contextWindowTokens);
    }
    return flattenGroupedModels(grouped.data, ctxByRef);
  }, [grouped.data, availability.data]);

  const rowByKey = useMemo(() => {
    const map = new Map<string, BuilderModelRow>();
    for (const row of data ?? []) map.set(row.key, row);
    return map;
  }, [data]);

  return {
    ...grouped,
    data,
    /** Look up the N-5 row for a pipeline entry (match by entry key). */
    rowByKey,
  };
}
