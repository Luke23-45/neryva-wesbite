import { describe, expect, it } from 'vitest';
import { parseModelCosts, costLabel, cachedCostLabel } from './useSetupModels';

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
