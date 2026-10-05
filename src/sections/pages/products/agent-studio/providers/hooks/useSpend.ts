/**
 * Providers Phase 7 — Wave W1: react-query hooks for Tab D (Spend & budgets).
 *
 * Wraps the shared `../api.ts` spend seam (contract matches engine waves
 * E1/E2 exactly). Mutations invalidate the summary query on success so every
 * panel re-renders from engine state — cap saves are never optimistic (money
 * must not display a state the server didn't accept). breach_action flips
 * are optimistic with rollback, since the radio must respond immediately and
 * the server remains the authority on error.
 * Error copy is rendered by callers from `ApiError.message` only.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  downloadSpendExport,
  fetchSpendSummary,
  patchIncludeByokSpend,
  patchSpendBudget,
  type SpendBudgetPatch,
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
    typeof useMutation<
      { cap_usd_cents: number | null; breach_action: 'refuse' | 'alert_only' },
      Error,
      SpendBudgetPatch,
      { prev: Array<[readonly unknown[], SpendSummaryView | undefined]> } | undefined
    >
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
 *
 * breach_action updates are optimistic with rollback: the radio must flip
 * immediately and revert if the server rejects — money controls must never
 * display a state the server didn't accept.
 */
export function useSpendMutations(orgId: string): SpendMutations {
  const queryClient = useQueryClient();
  const invalidateSpend = () =>
    queryClient.invalidateQueries({ queryKey: spendKeys.root(orgId) });

  const patchBudget = useMutation({
    mutationFn: (payload: SpendBudgetPatch) => patchSpendBudget(orgId, payload),
    onMutate: async (payload) => {
      if (payload.breach_action === undefined) return undefined;
      await queryClient.cancelQueries({ queryKey: spendKeys.root(orgId) });
      const summaryKey = [...spendKeys.root(orgId), 'summary'] as const;
      const prev = queryClient.getQueriesData<SpendSummaryView>({
        queryKey: summaryKey,
      });
      queryClient.setQueriesData<SpendSummaryView>({ queryKey: summaryKey }, (old) =>
        old ? { ...old, budget: { ...old.budget, breach_action: payload.breach_action! } } : old,
      );
      return { prev };
    },
    onError: (_err, _payload, context) => {
      context?.prev.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
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
