/**
 * The org's current subscription, derived from real engine state — pure,
 * so the mapping is unit-testable and never hand-waved in JSX.
 * - enterprise: an active enterprise commitment (discounted rate + BYOK).
 * - payg: the engine's single plan identifier (plans.ts: tiers are dead).
 * - free: no paid plan — the org runs on the 1,000 monthly free credit grant
 *   (credit-ledger.service grantFreeMonthly; no rollover).
 */
export type SubscriptionKind = 'enterprise' | 'payg' | 'free';

export function deriveSubscriptionKind(args: {
  enterprise: boolean;
  plan: string | null;
}): SubscriptionKind {
  if (args.enterprise) return 'enterprise';
  if (args.plan === 'payg') return 'payg';
  return 'free';
}

export const SUBSCRIPTION_COPY: Record<SubscriptionKind, { name: string; blurb: string }> = {
  // Blurbs reuse the approved pricing-sheet copy — never invented here.
  enterprise: {
    name: 'Enterprise',
    blurb: 'Active enterprise commitment — discounted credit rate and bring-your-own-key.',
  },
  payg: {
    name: 'Pay-as-you-go',
    blurb: '1 credit = $0.01. Top up anytime, $10 minimum.',
  },
  free: {
    name: 'Free',
    blurb: '1,000 free credits every month. No card required.',
  },
};
