/**
 * `useEntitlement(product)` — the per-product entitlement state plus the two
 * derived flags the UI needs: reads blocked (none/expired → the engine
 * answers 403) and writes blocked (past_due/suspended → the engine answers
 * 402).
 *
 * Lives in its own module (not alongside the EntitlementBanner/Gate
 * components) so each file exports one kind of thing and stays
 * fast-refresh clean.
 */
import { useMemo } from 'react';
import { useOrg, type EntitlementState } from '@/Context/OrgContext';

export interface EntitlementInfo {
  state: EntitlementState;
  /** Engine answers 402 on writes (payment states) — render read-only. */
  writeBlocked: boolean;
  /** Engine answers 403 on reads (never entitled / expired) — gate the page. */
  readBlocked: boolean;
}

export function useEntitlement(product: string): EntitlementInfo {
  const { entitlementState } = useOrg();
  const state = entitlementState(product);
  return useMemo(
    () => ({
      state,
      writeBlocked: state === 'past_due' || state === 'suspended',
      readBlocked: state === 'none' || state === 'expired',
    }),
    [state],
  );
}
