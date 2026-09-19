import { describe, expect, it } from 'vitest';
import { BRAND_LIMIT, countBrandChars, estimateBrandTokens, isBrandEmpty } from './brand-model';

describe('brand model (C03 binds)', () => {
  it('enforces the engine contract (optional, ≤2000, blank is valid)', () => {
    expect(BRAND_LIMIT).toBe(2000);
    expect(isBrandEmpty('')).toBe(true);
    expect(isBrandEmpty('   ')).toBe(true);
    expect(isBrandEmpty('Short sentences.')).toBe(false);
    expect(countBrandChars('abc')).toBe(3);
    expect(countBrandChars('x'.repeat(BRAND_LIMIT))).toBe(BRAND_LIMIT);
    expect(estimateBrandTokens(100)).toBe(25);
    expect(estimateBrandTokens(101)).toBe(26);
  });
});
