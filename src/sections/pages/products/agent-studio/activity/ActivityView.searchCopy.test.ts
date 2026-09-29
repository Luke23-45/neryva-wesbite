import { describe, expect, it } from 'vitest';
import { auditSearchNoMatchCopy } from './ActivityView';

/**
 * P2-1 — the Activity search filters only the 50 loaded rows client-side,
 * so the no-match copy must name that window. It must not imply the whole
 * trail was searched, and it must point at the two real escape hatches
 * (date range, full-trail export).
 */
describe('auditSearchNoMatchCopy', () => {
  it('names the 50-row window in the title', () => {
    const copy = auditSearchNoMatchCopy();
    expect(copy.title).toContain('50 most recent events');
  });

  it('points at the date range and the export, not at "no events exist"', () => {
    const copy = auditSearchNoMatchCopy();
    expect(copy.description).toMatch(/date range/i);
    expect(copy.description).toMatch(/export/i);
    expect(copy.description.toLowerCase()).not.toContain('no events');
  });

  it('is deterministic (pure copy, no props)', () => {
    expect(auditSearchNoMatchCopy()).toEqual(auditSearchNoMatchCopy());
  });
});
