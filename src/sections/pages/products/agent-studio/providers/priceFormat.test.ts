import { describe, expect, it } from 'vitest';
import { formatUsdPer1M } from './priceFormat';

describe('formatUsdPer1M', () => {
  it('formats whole-dollar prices with two decimals', () => {
    expect(formatUsdPer1M(2.5)).toBe('$2.50');
    expect(formatUsdPer1M(0.01)).toBe('$0.01');
  });

  it('never renders a known sub-cent price as $0.00', () => {
    expect(formatUsdPer1M(0.004)).toBe('<$0.01');
    expect(formatUsdPer1M(0.009)).toBe('<$0.01');
  });

  it('renders zero as <$0.01, never $0.00', () => {
    expect(formatUsdPer1M(0)).toBe('<$0.01');
  });
});
