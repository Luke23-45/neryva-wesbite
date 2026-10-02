import type { EntitlementState } from '@/Context/OrgContext';

/**
 * Sidebar footer line under the workspace name (A4/A5): the real
 * entitlement state from /console/home, never a fictional tier.
 * `trial` maps to "Active" to match the server, which maps legacy trial →
 * active (no-trial product decision). A plan-name label stays deferred
 * (ledger D-1) — the entitlement state does not carry the plan name.
 *
 * States that need the user's attention carry a `hint` (shown as a tooltip
 * on the label: what the state means + what to do) and `billingAction`
 * (the label links to the studio billing page, the real route
 * `/agent-studio/settings/billing`).
 */
export type EntitlementLabelInfo = {
  label: string;
  /** What the state means + the action to take; null when nothing is needed. */
  hint: string | null;
  /** When true the label links to the studio billing page. */
  billingAction: boolean;
};

const ENTITLEMENT_INFO: Record<EntitlementState, EntitlementLabelInfo> = {
  trial: { label: 'Active', hint: null, billingAction: false },
  active: { label: 'Active', hint: null, billingAction: false },
  past_due: {
    label: 'Past due',
    hint: 'The last payment failed — update the payment method in Billing to keep the workspace running.',
    billingAction: true,
  },
  suspended: {
    label: 'Suspended',
    hint: 'This workspace is suspended — agents and runs are paused. Open Billing to resolve it.',
    billingAction: true,
  },
  expired: {
    label: 'Expired',
    hint: 'This plan expired — usage and runs are limited. Renew in Billing to reactivate the workspace.',
    billingAction: true,
  },
  none: {
    label: 'No active plan',
    hint: 'This workspace has no active plan — usage and runs are limited. Open Billing to activate a plan.',
    billingAction: true,
  },
};

export function entitlementLabelInfo(state: EntitlementState): EntitlementLabelInfo {
  return ENTITLEMENT_INFO[state];
}

export function planLabelForEntitlement(state: EntitlementState): string {
  return ENTITLEMENT_INFO[state].label;
}
