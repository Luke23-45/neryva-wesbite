import { describe, expect, it } from 'vitest';
import {
  BUDGET_BOUNDS,
  CAP_LABELS,
  ESTIMATE_COPY,
  FAIL_CLOSED_COPY,
  PLATFORM_DEFAULTS,
  PUBLISH_COPY,
  cachedPriceLine,
  describeCap,
  estimateRun,
  formatDollars,
  formatDuration,
  formatEstimate,
  formatRatePer1k,
  gradeBudget,
} from './budget-model';

describe('bounds + platform defaults (verified matrix)', () => {
  it('mirrors validation bounds and the Studio compile defaults', () => {
    expect(BUDGET_BOUNDS.max_total_tokens).toEqual({ min: 1000, max: 2_000_000 });
    expect(BUDGET_BOUNDS.max_cost_micros).toEqual({ min: 0, max: 1_000_000_000_000 });
    expect(BUDGET_BOUNDS.wall_clock_seconds).toEqual({ min: 0, max: 86_400 });
    expect(BUDGET_BOUNDS.max_tool_calls).toEqual({ min: 0, max: 1000 });
    expect(BUDGET_BOUNDS.max_model_calls).toEqual({ min: 1, max: 200 });
    expect(PLATFORM_DEFAULTS).toEqual({ max_total_tokens: 200_000, max_model_calls: 16, max_tool_calls: 8, wall_clock_seconds: 120 });
    expect(Object.keys(CAP_LABELS)).toHaveLength(5);
  });
});

describe('describeCap (unset-vs-zero resolver)', () => {
  it('treats cost unset and $0 identically: unenforced, loudly', () => {
    for (const value of [undefined, 0]) {
      const described = describeCap('max_cost_cents', value);
      expect(described.state).toBe('No spend cap');
      expect(described.whisper).toMatch(/cost-unchecked/);
    }
    expect(describeCap('max_cost_cents', 500)).toMatchObject({ state: '$5.00' });
  });
  it('resolves 0 to defaults for wall and tools, never instant-fail', () => {
    expect(describeCap('wall_clock_seconds', 0).state).toBe('Platform default (120s)');
    expect(describeCap('wall_clock_seconds', 0).whisper).toMatch(/not an instant fail/);
    expect(describeCap('wall_clock_seconds', undefined).state).toBe('Platform default (120s)');
    expect(describeCap('max_tool_calls', 0).state).toBe('Platform default (8)');
    expect(describeCap('max_total_tokens', undefined).state).toBe('Platform default (200,000)');
    expect(describeCap('max_model_calls', undefined).whisper).toMatch(/16/);
    expect(describeCap('max_model_calls', 30).state).toBe('30 calls');
  });
});

describe('formatters', () => {
  it('formats dollars, durations, and rates', () => {
    expect(formatDollars(500)).toBe('$5.00');
    expect(formatDollars(123456)).toBe('$1,234.56');
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(600)).toBe('10 min');
    expect(formatDuration(3660)).toBe('1h 1min');
    expect(formatRatePer1k(3_000_000)).toBe('$3.0000/1k');
  });
});

describe('estimateRun / cachedPriceLine (never derived)', () => {
  const priced = { ref: 'a/b', costMicrosPer1kInput: 3_000_000, costMicrosPer1kOutput: 15_000_000, costMicrosPer1kCachedInput: 300_000 };
  it('estimates at uncached rates, null when unpriced', () => {
    expect(estimateRun(20_000, priced)?.micros).toBe(360_000_000);
    expect(formatEstimate(360_000_000)).toBe('~$360.00');
    expect(estimateRun(20_000, { ref: 'x/y', costMicrosPer1kInput: null, costMicrosPer1kOutput: null, costMicrosPer1kCachedInput: null })).toBeNull();
  });
  it('shows the cached price only when reported', () => {
    expect(cachedPriceLine(priced)).toBe('cached-in $0.3000/1k');
    expect(cachedPriceLine({ ...priced, costMicrosPer1kCachedInput: null })).toBeNull();
  });
});

describe('gradeBudget', () => {
  it('grades capped+priced, capped-unpriced, uncapped, and blank distinctly', () => {
    expect(gradeBudget({ max_cost_cents: 500 }, 360_000_000).subtitle).toBe('Capped · ~$360.00 rough');
    expect(gradeBudget({ max_cost_cents: 500 }, null).subtitle).toBe('Capped at $5.00');
    expect(gradeBudget({ max_total_tokens: 20_000 }, null).subtitle).toBe('No spend cap');
    expect(gradeBudget({}, null).subtitle).toBe('Platform defaults');
  });
});

describe('copy constants', () => {
  it('states fail-closed, rough-estimate, and publish laws', () => {
    expect(FAIL_CLOSED_COPY).toMatch(/FAILED.*terminal event.*quota released/);
    expect(ESTIMATE_COPY).toMatch(/Rough, not the bill/);
    expect(PUBLISH_COPY).toMatch(/publish to serve/);
  });
});
