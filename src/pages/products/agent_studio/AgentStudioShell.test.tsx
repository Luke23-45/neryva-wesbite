import { describe, expect, it } from 'vitest';
import { planLabelForEntitlement } from './entitlementPlanLabel';
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
    ['none', 'Not enabled'],
  ] as Array<[EntitlementState, string]>)('maps %s to %s', (state, label) => {
    expect(planLabelForEntitlement(state)).toBe(label);
  });

  it('never emits the fictional "Pro" tier for any state', () => {
    const states: EntitlementState[] = ['none', 'trial', 'active', 'past_due', 'suspended', 'expired'];
    for (const state of states) {
      expect(planLabelForEntitlement(state)).not.toBe('Pro');
    }
  });
});
