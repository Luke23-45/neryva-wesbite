/**
 * Providers Phase 7 — Wave W1: react-query hooks for Tab D (Spend & budgets).
 *
 * Wraps the shared `../api.ts` spend seam (contract matches engine waves
 * E1/E2 exactly). Mutations invalidate the summary query on success so every
 * panel re-renders from engine state — no optimistic patching of money.
 * Error copy is rendered by callers from `ApiError.message` only.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  downloadSpendExport,
  fetchSpendSummary,
  patchIncludeByokSpend,
  patchSpendBudget,
  type SpendSummaryView,
  type SpendWindow,
} from '../api';

export const spendKeys = {
  root: (orgId: string) => ['org', orgId, 'spend'] as const,
  summary: (orgId: string, window: SpendWindow) =>
    [...spendKeys.root(orgId), 'summary', window] as const,
  models: (orgId: string, window: SpendWindow) =>
    [...spendKeys.root(orgId), 'models', window] as const,
};

export interface SpendMutations {
  patchBudget: ReturnType<
    typeof useMutation<{ cap_usd_cents: number | null }, Error, number | null>
  >;
  patchIncludeByok: ReturnType<typeof useMutation<Record<string, unknown>, Error, boolean>>;
  exportSpend: ReturnType<typeof useMutation<void, Error, 'csv' | 'json'>>;
}

/** Org spend summary for a 7d/30d window. Disabled until an org id is present. */
export function useSpendSummary(
  orgId: string | null,
  window: SpendWindow,
  enabled = true,
): ReturnType<typeof useQuery<SpendSummaryView>> {
  return useQuery<SpendSummaryView>({
    queryKey: spendKeys.summary(orgId ?? 'none', window),
    queryFn: () => fetchSpendSummary(orgId as string, window),
    enabled: !!orgId && enabled,
    staleTime: 60_000,
  });
}

/**
 * All spend mutations for one org. Each invalidates the spend query tree on
 * success so the overview, budget, and fee panels reflect server state.
 */
export function useSpendMutations(orgId: string): SpendMutations {
  const queryClient = useQueryClient();
  const invalidateSpend = () =>
    queryClient.invalidateQueries({ queryKey: spendKeys.root(orgId) });

  const patchBudget = useMutation({
    mutationFn: (cap_usd_cents: number | null) => patchSpendBudget(orgId, cap_usd_cents),
    onSuccess: () => invalidateSpend(),
  });

  const patchIncludeByok = useMutation({
    mutationFn: (include: boolean) => patchIncludeByokSpend(orgId, include),
    onSuccess: () => invalidateSpend(),
  });

  const exportSpend = useMutation({
    mutationFn: (format: 'csv' | 'json') => downloadSpendExport(orgId, format),
  });

  return { patchBudget, patchIncludeByok, exportSpend };
}
