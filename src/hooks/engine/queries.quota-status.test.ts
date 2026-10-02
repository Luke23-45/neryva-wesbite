import { describe, expect, it } from 'vitest';
import { parseQuotaMeters, parseQuotaStatus } from './queries';

/**
 * P2-5 (US-07) — the engine returns entitlement_state/allowed/reason
 * alongside the quota meters (`/console/org/:orgId/limits` →
 * `QuotaService.usageSnapshot` → `QuotaDecision`); the parser used to drop
 * them, so an over-quota org got no signal. The snapshot path always
 * reports allowed:true/reason:null, so overQuota is derived from
 * used > limit — the real signal.
 */
const wirePayload = {
  products: [
    {
      product: 'agent_studio',
      entitlement_state: 'active',
      quota: {
        allowed: true,
        reason: null,
        product: { limit_usd: 100, used_usd: 120, limit_events: 1000, used_events: 50 },
        project: null,
      },
    },
    {
      product: 'deployment',
      entitlement_state: 'past_due',
      quota: {
        allowed: true,
        reason: null,
        product: { limit_usd: 50, used_usd: 10, limit_events: 500, used_events: 5 },
        project: null,
      },
    },
  ],
};

describe('parseQuotaStatus', () => {
  it('keeps the meters from the real wire shape', () => {
    const { meters } = parseQuotaStatus(wirePayload, 'agent_studio');
    const byLabel = new Map(meters.map((m) => [m.label, m]));
    expect(byLabel.get('USD')).toMatchObject({ used: 120, limit: 100 });
    // P3-4: labels are title-cased at the source ("events" → "Events").
    expect(byLabel.get('Events')).toMatchObject({ used: 50, limit: 1000 });
  });

  it('keeps entitlement_state from the matching product entry', () => {
    expect(parseQuotaStatus(wirePayload, 'agent_studio').signal.entitlementState).toBe('active');
    expect(parseQuotaStatus(wirePayload, 'deployment').signal.entitlementState).toBe('past_due');
  });

  it('keeps allowed/reason when the engine reports them', () => {
    const payload = {
      products: [
        {
          product: 'agent_studio',
          entitlement_state: 'suspended',
          quota: {
            allowed: false,
            reason: 'product_spend',
            product: { limit_usd: 100, used_usd: 150, limit_events: 1000, used_events: 50 },
            project: null,
          },
        },
      ],
    };
    const { signal } = parseQuotaStatus(payload, 'agent_studio');
    expect(signal.allowed).toBe(false);
    expect(signal.reason).toBe('product_spend');
    expect(signal.entitlementState).toBe('suspended');
  });

  it('derives overQuota from used > limit (the snapshot path never evaluates allowed)', () => {
    // used_usd 120 > limit_usd 100 → over quota even though allowed:true.
    expect(parseQuotaStatus(wirePayload, 'agent_studio').signal.overQuota).toBe(true);
    // deployment is under on both meters.
    expect(parseQuotaStatus(wirePayload, 'deployment').signal.overQuota).toBe(false);
  });

  it('does not flag overQuota for uncapped meters', () => {
    const payload = {
      products: [
        {
          product: 'agent_studio',
          entitlement_state: 'active',
          quota: {
            allowed: true,
            reason: null,
            product: { limit_usd: null, used_usd: 999999, limit_events: null, used_events: 42 },
            project: null,
          },
        },
      ],
    };
    const { meters, signal } = parseQuotaStatus(payload, 'agent_studio');
    expect(meters.every((m) => m.limit === null)).toBe(true);
    expect(signal.overQuota).toBe(false);
  });

  it('falls back to a null signal on legacy shapes without entitlement data', () => {
    const { meters, signal } = parseQuotaStatus({ used_usd: 10, limit_usd: 100 }, 'agent_studio');
    expect(meters).toHaveLength(1);
    expect(signal).toEqual({ entitlementState: null, allowed: null, reason: null, overQuota: false });
  });

  it('returns empty meters and a null signal for non-objects', () => {
    for (const raw of [null, undefined, 42, 'nope']) {
      const { meters, signal } = parseQuotaStatus(raw, 'agent_studio');
      expect(meters).toEqual([]);
      expect(signal).toEqual({ entitlementState: null, allowed: null, reason: null, overQuota: false });
    }
  });

  it('returns a null signal when the product is absent from the payload', () => {
    const { meters, signal } = parseQuotaStatus(wirePayload, 'no_such_product');
    expect(meters).toEqual([]);
    expect(signal.entitlementState).toBeNull();
    expect(signal.overQuota).toBe(false);
  });
});

describe('parseQuotaMeters (backward compatibility)', () => {
  it('still returns just the meters', () => {
    const meters = parseQuotaMeters(wirePayload, 'agent_studio');
    expect(meters).toHaveLength(2);
    expect(meters.every((m) => typeof m.label === 'string' && typeof m.used === 'number')).toBe(true);
  });
});
