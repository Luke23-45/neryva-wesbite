import { describe, expect, it } from 'vitest';
import { shortDate, datasetsListFootnote } from './DatasetsView';

/**
 * Console field audit — D3: the Created cell rendered the raw ISO string
 * (`2026-09-29T…`), unlike the relative/short treatment elsewhere (blocks,
 * memory). `shortDate` renders a short local date instead.
 */
describe('shortDate (D3)', () => {
  it('renders a short local date, never the raw ISO string', () => {
    const out = shortDate('2026-09-29T10:20:30.000Z');
    expect(out).not.toContain('T');
    expect(out).toContain('2026');
  });

  it('renders the em dash for missing or unparseable input', () => {
    expect(shortDate(null)).toBe('—');
    expect(shortDate('not-a-date')).toBe('—');
    expect(shortDate('')).toBe('—');
  });
});

/**
 * Console field audit — D4: the list endpoint caps at 100 server-side
 * (`eval.service.listDatasets` fixed LIMIT 100, no param). Documents, blocks,
 * and memory all disclose their caps — this footnote does the same here.
 */
describe('datasetsListFootnote (D4)', () => {
  it('discloses the server-side 100 cap when the page is full', () => {
    const out = datasetsListFootnote(100);
    expect(out).toContain('100');
    expect(out.toLowerCase()).toContain('cap');
  });

  it('states the full count when under the cap', () => {
    expect(datasetsListFootnote(3)).toContain('all 3 datasets');
    expect(datasetsListFootnote(1)).toContain('all 1 dataset');
    expect(datasetsListFootnote(0)).toContain('all 0 datasets');
  });
});
