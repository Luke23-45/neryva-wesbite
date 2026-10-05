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
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
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

interface BudgetPatchResult {
  cap_usd_cents: number | null;
  breach_action: 'refuse' | 'alert_only';
  include_byok_spend: boolean;
}

interface OptimisticSummaryCtx {
  prev: Array<[readonly unknown[], SpendSummaryView | undefined]>;
}

export interface SpendMutations {
  /** Cap saves — never optimistic: money must not display a state the server didn't accept. */
  patchBudget: ReturnType<typeof useMutation<BudgetPatchResult, Error, SpendBudgetPatch>>;
  /** breach_action flips — optimistic with rollback. */
  patchBreachAction: ReturnType<
    typeof useMutation<BudgetPatchResult, Error, 'refuse' | 'alert_only', OptimisticSummaryCtx>
  >;
  /** BYOK toggle — optimistic with rollback, like the breach radio. */
  patchIncludeByok: ReturnType<
    typeof useMutation<BudgetPatchResult, Error, boolean, OptimisticSummaryCtx>
  >;
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
 * Pending states are decoupled per control: the cap save (`patchBudget`) is
 * never optimistic and has its own `isPending`; the breach-action radio
 * (`patchBreachAction`) and the BYOK toggle (`patchIncludeByok`) are
 * optimistic with rollback — they must respond immediately and revert if
 * the server rejects, since money controls must never display a state the
 * server didn't accept.
 */
export function useSpendMutations(orgId: string): SpendMutations {
  const queryClient = useQueryClient();
  const summaryPrefix = [...spendKeys.root(orgId), 'summary'] as const;
  const invalidateSpend = () =>
    queryClient.invalidateQueries({ queryKey: spendKeys.root(orgId) });

  // Snapshot every cached summary window and apply an optimistic flip; the
  // returned context restores the snapshot on error (rollback).
  const optimisticSummary = async (
    qc: QueryClient,
    flip: (old: SpendSummaryView) => SpendSummaryView,
  ): Promise<OptimisticSummaryCtx> => {
    await qc.cancelQueries({ queryKey: spendKeys.root(orgId) });
    const prev = qc.getQueriesData<SpendSummaryView>({ queryKey: summaryPrefix });
    qc.setQueriesData<SpendSummaryView>({ queryKey: summaryPrefix }, (old) =>
      old ? flip(old) : old,
    );
    return { prev };
  };
  /**
   * Per-key rollback: restore only the budget key this mutation touched,
   * from its pre-mutation snapshot, leaving any concurrently-succeeded
   * sibling key (e.g. a BYOK flip that landed while a breach flip failed)
   * intact in the UI. The onSettled refetch still reconciles everything
   * against the server.
   */
  const rollbackBudgetKey = (
    context: OptimisticSummaryCtx | undefined,
    key: 'breach_action' | 'include_byok_spend',
  ) => {
    context?.prev.forEach(([qk, snapshot]) => {
      queryClient.setQueryData<SpendSummaryView>(qk, (current) => {
        if (!current || !snapshot?.budget) return current;
        return { ...current, budget: { ...current.budget, [key]: snapshot.budget[key] } };
      });
    });
  };

  const patchBudget = useMutation({
    mutationFn: (payload: SpendBudgetPatch) => patchSpendBudget(orgId, payload),
    onSuccess: () => invalidateSpend(),
  });

  const patchBreachAction = useMutation({
    mutationFn: (action: 'refuse' | 'alert_only') =>
      patchSpendBudget(orgId, { breach_action: action }),
    onMutate: (action) =>
      optimisticSummary(queryClient, (old) => ({
        ...old,
        budget: { ...old.budget, breach_action: action },
      })),
    onError: (_err, _action, context) => rollbackBudgetKey(context, 'breach_action'),
    onSuccess: () => invalidateSpend(),
  });

  const patchIncludeByok = useMutation({
    mutationFn: (include: boolean) => patchIncludeByokSpend(orgId, include),
    onMutate: (include) =>
      optimisticSummary(queryClient, (old) => ({
        ...old,
        budget: { ...old.budget, include_byok_spend: include },
      })),
    onError: (_err, _include, context) => rollbackBudgetKey(context, 'include_byok_spend'),
    onSuccess: () => invalidateSpend(),
  });

  const exportSpend = useMutation({
    mutationFn: (format: 'csv' | 'json') => downloadSpendExport(orgId, format),
  });

  return { patchBudget, patchBreachAction, patchIncludeByok, exportSpend };
}
