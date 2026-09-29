import type { EntitlementState } from '@/Context/OrgContext';

/**
 * Sidebar footer line under the workspace name (A4/A5): the real
 * entitlement state from /console/home, never a fictional tier.
 * `trial` maps to "Active" to match the server, which maps legacy trial →
 * active (no-trial product decision). A plan-name label stays deferred
 * (ledger D-1) — the entitlement state does not carry the plan name.
 */
const ENTITLEMENT_LABEL: Record<EntitlementState, string> = {
  trial: 'Active',
  active: 'Active',
  past_due: 'Past due',
  suspended: 'Suspended',
  expired: 'Expired',
  none: 'Not enabled',
};

export function planLabelForEntitlement(state: EntitlementState): string {
  return ENTITLEMENT_LABEL[state];
}
