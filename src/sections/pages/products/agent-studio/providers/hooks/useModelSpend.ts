/**
 * Providers Phase 7 — per-model spend query hook for Tab D (Spend & budgets).
 *
 * Wraps the shared `../api.ts` model-spend seam (contract matches the engine
 * exactly). Rows arrive sorted by spend desc; callers render `spend_usd` as-is
 * and copy `pricing_basis` verbatim — no currency math in the client.
 */
import { useQuery } from '@tanstack/react-query';
import {
  fetchModelSpend,
  type ModelSpendResponse,
  type SpendWindow,
} from '../api';
import { spendKeys } from './useSpend';

/** Per-model spend for a 7d/30d window. Disabled until an org id is present. */
export function useModelSpend(
  orgId: string | null,
  window: SpendWindow,
  enabled = true,
): ReturnType<typeof useQuery<ModelSpendResponse>> {
  return useQuery<ModelSpendResponse>({
    queryKey: spendKeys.models(orgId ?? 'none', window),
    queryFn: () => fetchModelSpend(orgId as string, window),
    enabled: !!orgId && enabled,
    staleTime: 60_000,
  });
}
