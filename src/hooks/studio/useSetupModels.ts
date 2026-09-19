/**
 * Model catalog reads (team_setup_ledger.md F-C1) — the maker picker source:
 * GET console/org/:orgId/models → {models: ModelAvailabilityRow[]}
 * (`engine/src/modules/assistants/model-catalog.controller.ts:22`,
 * `model-catalog.service.ts:55-66,178-236`).
 *
 * Rows carry `usable` + machine-readable `reasons[]`
 * (provider_credential_missing | provider_not_enabled |
 * residency_incompatible) — the UI renders unusable rows DISABLED with the
 * reasons inline, never hidden. All roles may read.
 */
import { useQuery } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';

export interface ModelAvailability {
  provider: string;
  modelId: string;
  /** Canonical `provider/model` reference for allowed_models. */
  ref: string;
  displayName: string;
  contextWindowTokens: number | null;
  maxOutputTokens: number | null;
  capabilities: Record<string, unknown>;
  residency: string | null;
  usable: boolean;
  reasons: string[];
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseModelAvailability(raw: unknown): ModelAvailability[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.models) ? record.models : [];
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const provider = str(item.provider) ?? '';
      const modelId = str(item.model_id) ?? str(item.modelId) ?? '';
      if (!provider || !modelId) {
        return null;
      }
      const reasons = Array.isArray(item.reasons) ? item.reasons.filter((r): r is string => typeof r === 'string') : [];
      return {
        provider,
        modelId,
        ref: `${provider}/${modelId}`,
        displayName: str(item.display_name) ?? str(item.displayName) ?? `${provider}/${modelId}`,
        contextWindowTokens: typeof item.context_window_tokens === 'number' ? item.context_window_tokens : null,
        maxOutputTokens: typeof item.max_output_tokens === 'number' ? item.max_output_tokens : null,
        capabilities: typeof item.capabilities === 'object' && item.capabilities !== null ? (item.capabilities as Record<string, unknown>) : {},
        residency: str(item.residency),
        usable: item.usable === true,
        reasons,
      } satisfies ModelAvailability;
    })
    .filter((m): m is ModelAvailability => m !== null);
}

export function useModelAvailability(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['studio', 'setup', 'models', orgId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/models`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: parseModelAvailability,
  });
}

export interface ModelCost {
  provider: string;
  model: string;
  /** Canonical `provider/model` join key. */
  ref: string;
  costMicrosPer1kInput: number | null;
  costMicrosPer1kOutput: number | null;
  /** C09: cached-input unit price — reported or null, NEVER derived (lone-half rule). */
  costMicrosPer1kCachedInput: number | null;
  currency: string | null;
  effectiveFrom: string | null;
}

export function parseModelCosts(raw: unknown): ModelCost[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.costs) ? record.costs : [];
  return list
    .map((entry): ModelCost | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const provider = str(item.provider) ?? '';
      const model = str(item.model) ?? '';
      if (!provider || !model) {
        return null;
      }
      const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
      return {
        provider,
        model,
        ref: `${provider}/${model}`,
        costMicrosPer1kInput: num(item.costMicrosPer1kInput) ?? num(item.cost_micros_per_1k_input),
        costMicrosPer1kOutput: num(item.costMicrosPer1kOutput) ?? num(item.cost_micros_per_1k_output),
        costMicrosPer1kCachedInput: num(item.costMicrosPer1kCachedInput) ?? num(item.cost_micros_per_1k_cached_input),
        currency: str(item.currency),
        effectiveFrom: str(item.effectiveFrom) ?? str(item.effective_from),
      };
    })
    .filter((c): c is ModelCost => c !== null);
}

/** List prices (G6): latest effective unretired point per model; empty = unpriced (label, never zero-imply). */
export function useModelCosts(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['studio', 'setup', 'models', orgId, 'costs'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/models/costs`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 300_000,
    select: parseModelCosts,
  });
}

/** Unit price label ($/1k tokens) or 'unpriced'. */
export function costLabel(cost: ModelCost | undefined, side: 'in' | 'out'): string {
  if (!cost) {
    return 'unpriced';
  }
  const micros = side === 'in' ? cost.costMicrosPer1kInput : cost.costMicrosPer1kOutput;
  if (micros === null) {
    return 'unpriced';
  }
  return `$${(micros / 1_000_000).toFixed(4)}/1k`;
}

/**
 * Cached-input unit price label, or null when the catalog does not report it
 * (C09 lone-half rule — callers render nothing instead of deriving).
 */
export function cachedCostLabel(cost: ModelCost | undefined): string | null {
  if (!cost || cost.costMicrosPer1kCachedInput === null) {
    return null;
  }
  return `$${(cost.costMicrosPer1kCachedInput / 1_000_000).toFixed(4)}/1k`;
}
