import { describe, expect, it } from 'vitest';
import { validateBlockJson } from './types';

describe('validateBlockJson syntax issues (B8)', () => {
  it('flags invalid JSON as not-ok with an issue', () => {
    const result = validateBlockJson('any', '{"a": }');
    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('never states the error location twice in one message', () => {
    // V8 formats vary by engine ("at position N (line L column C)" vs none);
    // whatever the format, the location must read at most once, canonically.
    for (const text of ['{"a": }', '{\n"a": 1,\n"bad": }', '[1, 2,]']) {
      const result = validateBlockJson('any', text);
      expect(result.ok).toBe(false);
      const message = result.issues[0]?.message ?? '';
      const canonical = message.match(/\(line \d+, column \d+\)/g) ?? [];
      expect(canonical.length).toBeLessThanOrEqual(1);
      // No V8-style "(line L column C)" remnant may survive the strip.
      expect(message).not.toMatch(/\(line \d+ column \d+\)/);
      expect(message).not.toMatch(/at position \d+/);
    }
  });

  it('returns the bare message with no appended location when V8 reports no position', () => {
    const result = validateBlockJson('any', '{"a": }');
    expect(result.ok).toBe(false);
    const message = result.issues[0]?.message ?? '';
    expect(message.length).toBeGreaterThan(0);
    expect(message).not.toMatch(/\(line \d+, column \d+\)/);
  });
});
