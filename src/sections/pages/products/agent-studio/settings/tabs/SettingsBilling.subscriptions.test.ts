import { describe, expect, it } from 'vitest';
import { deriveSubscriptionKind } from './subscriptionKind';

describe('deriveSubscriptionKind', () => {
  it('enterprise commitment wins over any plan value', () => {
    expect(deriveSubscriptionKind({ enterprise: true, plan: 'payg' })).toBe('enterprise');
    expect(deriveSubscriptionKind({ enterprise: true, plan: null })).toBe('enterprise');
  });

  it("the engine's single plan identifier maps to pay-as-you-go", () => {
    expect(deriveSubscriptionKind({ enterprise: false, plan: 'payg' })).toBe('payg');
  });

  it('no paid plan means the free monthly grant', () => {
    expect(deriveSubscriptionKind({ enterprise: false, plan: null })).toBe('free');
  });

  it('does not invent tiers for unknown plan strings', () => {
    expect(deriveSubscriptionKind({ enterprise: false, plan: 'trial' })).toBe('free');
    expect(deriveSubscriptionKind({ enterprise: false, plan: '' })).toBe('free');
  });
});
