import { describe, expect, it } from 'vitest';
import { planLabelForEntitlement, entitlementLabelInfo } from './entitlementPlanLabel';
import type { EntitlementState } from '@/Context/OrgContext';

/**
 * A4/A5: the sidebar footer no longer shows a fictional nav.json "Pro" tier.
 * The footer line is the real entitlement state from /console/home
 * (`entitlementState('agent_studio')`); a plan-name label stays deferred
 * (ledger D-1) because the entitlement state does not carry the plan name.
 */
describe('planLabelForEntitlement', () => {
  it.each([
    ['trial', 'Active'],
    ['active', 'Active'],
    ['past_due', 'Past due'],
    ['suspended', 'Suspended'],
    ['expired', 'Expired'],
    // "Not enabled" was cryptic — the label names the actual state.
    ['none', 'No active plan'],
  ] as Array<[EntitlementState, string]>)('maps %s to %s', (state, label) => {
    expect(planLabelForEntitlement(state)).toBe(label);
  });

  it('never emits the fictional "Pro" tier for any state', () => {
    const states: EntitlementState[] = ['none', 'trial', 'active', 'past_due', 'suspended', 'expired'];
    for (const state of states) {
      expect(planLabelForEntitlement(state)).not.toBe('Pro');
    }
  });

  it('explains states that need attention with a billing action', () => {
    const states: EntitlementState[] = ['none', 'past_due', 'suspended', 'expired'];
    for (const state of states) {
      const info = entitlementLabelInfo(state);
      expect(info.hint).toBeTruthy();
      expect(info.billingAction).toBe(true);
    }
  });

  it('stays quiet for healthy states', () => {
    for (const state of ['trial', 'active'] as EntitlementState[]) {
      const info = entitlementLabelInfo(state);
      expect(info.hint).toBeNull();
      expect(info.billingAction).toBe(false);
    }
  });
});
