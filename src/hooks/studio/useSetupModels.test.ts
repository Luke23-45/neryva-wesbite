import { describe, expect, it } from 'vitest';
import { parseModelAvailability, parseModelCosts, costLabel, cachedCostLabel } from './useSetupModels';

describe('parseModelAvailability', () => {
  it('reads subscription gating fields (snake_case and camelCase)', () => {
    const rows = parseModelAvailability({
      models: [
        { provider: 'a', model_id: 'm1', usable: false, reasons: ['subscription_required'], required_product: 'payg', required_product_label: 'Pay-as-you-go' },
        { provider: 'a', modelId: 'm2', usable: false, reasons: ['subscription_required'], requiredProduct: 'enterprise', requiredProductLabel: 'Enterprise' },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ ref: 'a/m1', requiredProduct: 'payg', requiredProductLabel: 'Pay-as-you-go' });
    expect(rows[1]).toMatchObject({ ref: 'a/m2', requiredProduct: 'enterprise', requiredProductLabel: 'Enterprise' });
  });

  it('nulls missing or invalid subscription fields without crashing', () => {
    const rows = parseModelAvailability({
      models: [
        { provider: 'a', model_id: 'm1', usable: true, reasons: [] },
        { provider: 'a', model_id: 'm2', usable: false, reasons: ['subscription_required'], required_product: 'platinum', required_product_label: 42 },
      ],
    });
    expect(rows).toHaveLength(2);
    // Missing fields → null, never invented.
    expect(rows[0]).toMatchObject({ requiredProduct: null, requiredProductLabel: null });
    // Unknown product + non-string label → null, never passed through.
    expect(rows[1]).toMatchObject({ requiredProduct: null, requiredProductLabel: null });
  });

  it('drops rows without provider/model', () => {
    expect(parseModelAvailability({ models: [{ provider: 'x' }] })).toEqual([]);
    expect(parseModelAvailability(null)).toEqual([]);
  });
});

describe('parseModelCosts', () => {
  it('reads list-price points (snake_case and camelCase)', () => {
    const rows = parseModelCosts({
      costs: [
        { provider: 'anthropic', model: 'claude', cost_micros_per_1k_input: 3000, cost_micros_per_1k_output: 15000, cost_micros_per_1k_cached_input: 300, currency: 'USD' },
        { provider: 'x', model: 'y', costMicrosPer1kInput: 1, costMicrosPer1kOutput: 2 },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ ref: 'anthropic/claude', costMicrosPer1kInput: 3000, costMicrosPer1kCachedInput: 300, currency: 'USD' });
    expect(rows[1]).toMatchObject({ costMicrosPer1kCachedInput: null });
  });

  it('drops rows without provider/model', () => {
    expect(parseModelCosts({ costs: [{ provider: 'x' }] })).toEqual([]);
    expect(parseModelCosts(null)).toEqual([]);
  });
});

describe('costLabel', () => {
  it('labels unit prices and never zero-implies the unpriced', () => {
    expect(costLabel({ provider: 'a', model: 'b', ref: 'a/b', costMicrosPer1kInput: 3000, costMicrosPer1kOutput: null, costMicrosPer1kCachedInput: null, currency: 'USD', effectiveFrom: null }, 'in')).toBe(
      '$0.0030/1k',
    );
    expect(costLabel(undefined, 'in')).toBe('unpriced');
    expect(
      costLabel({ provider: 'a', model: 'b', ref: 'a/b', costMicrosPer1kInput: null, costMicrosPer1kOutput: null, costMicrosPer1kCachedInput: null, currency: null, effectiveFrom: null }, 'out'),
    ).toBe('unpriced');
  });
});

describe('cachedCostLabel (C09 lone-half rule)', () => {
  it('labels the reported cached price and nulls the unreported (never derives)', () => {
    const base = { provider: 'a', model: 'b', ref: 'a/b', costMicrosPer1kInput: 3000, costMicrosPer1kOutput: 15000, currency: 'USD', effectiveFrom: null };
    expect(cachedCostLabel({ ...base, costMicrosPer1kCachedInput: 300 })).toBe('$0.0003/1k');
    expect(cachedCostLabel({ ...base, costMicrosPer1kCachedInput: null })).toBeNull();
    expect(cachedCostLabel(undefined)).toBeNull();
  });
});
