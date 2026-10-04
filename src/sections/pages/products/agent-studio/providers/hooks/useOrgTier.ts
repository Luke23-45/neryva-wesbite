import { useQuery } from '@tanstack/react-query';
import { useOrg } from '@/Context/OrgContext';

export type OrgTier = 'free' | 'payg' | 'enterprise' | 'unknown';

interface HomeProductsRow {
  key: string;
  entitlement_state: string;
}

interface HomeProductsResponse {
  products?: HomeProductsRow[];
}

/**
 * useOrgTier — best-effort client tier read for the Providers surface.
 *
 * Derivation (doc 18 policy, mirrored from `resolveOrgTierFromSources`):
 * - `entitlementState('agent_studio') === 'none'` → 'free'
 * - any product key containing 'enterprise' with state 'active' → 'enterprise'
 * - `entitlementState('agent_studio') === 'active'` (and no enterprise product) → 'payg'
 * - home query not yet in cache, or an unrecognized entitlement state → 'unknown'
 *
 * The product list is read from the SAME `['org', 'home']` query cache that
 * OrgProvider populates — `enabled: false` means this hook never fires its own
 * request; it renders 'unknown' until that cache lands.
 *
 * IMPORTANT — progressive enhancement only: the SERVER is the enforcement
 * authority (Phase 4 engine gates E-2 publish/run and E-3 create/custom-field,
 * commit `98b5224`). This hook only decides which affordances the UI paints.
 * A stale, spoofed, or optimistic client tier can never unlock a real action.
 */
export function useOrgTier(): OrgTier {
  const { orgId, entitlementState } = useOrg();

  const { data } = useQuery<HomeProductsResponse>({
    queryKey: ['org', 'home'],
    queryFn: async () => ({ products: [] }),
    enabled: false,
    staleTime: 30_000,
  });

  if (!orgId) return 'unknown';
  // Never claim a tier before the home payload exists: entitlementState reads
  // from the same cache and would report 'none' on a miss, which is 'free' —
  // a mislabel while loading. Fail toward 'unknown' instead.
  if (!data) return 'unknown';

  const products = data.products ?? [];
  if (products.some((p) => p.key.includes('enterprise') && p.entitlement_state === 'active')) {
    return 'enterprise';
  }

  const studio = entitlementState('agent_studio');
  if (studio === 'none') return 'free';
  if (studio === 'active') return 'payg';
  // 'trial' | 'past_due' | 'suspended' | 'expired' — billing states the client
  // must not resolve into a purchasable tier on its own. The server decides.
  return 'unknown';
}

/**
 * Does `tier` cover a catalog row that requires `required`?
 * 'unknown' is indeterminate — callers render the honest badge without an
 * upgrade CTA and let the server gate the action.
 */
export function tierCovers(tier: OrgTier, required: 'free' | 'payg' | 'enterprise'): boolean | null {
  if (tier === 'unknown') return null;
  if (tier === 'enterprise') return true;
  if (tier === 'payg') return required !== 'enterprise';
  return required === 'free';
}
