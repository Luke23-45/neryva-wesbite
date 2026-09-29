import { describe, expect, it } from 'vitest';
import { LANE_NODE_IDS } from '../lib/lane-model';
import { SECTION_GROUPS, allGroupedSectionIds, sectionLabel } from './section-groups';

describe('section-groups', () => {
  it('covers every section id exactly once', () => {
    const grouped = allGroupedSectionIds();
    expect([...grouped].sort()).toEqual([...LANE_NODE_IDS].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it('keeps group order stable', () => {
    expect(SECTION_GROUPS.map((g) => g.id)).toEqual([
      'agent',
      'intelligence',
      'knowledge',
      'actions',
      'safeguards',
      'validate',
    ]);
  });

  it('labels purpose as Identity and passes other labels through', () => {
    expect(sectionLabel('purpose', 'Purpose')).toBe('Identity');
    expect(sectionLabel('tools', 'Tools')).toBe('Tools');
  });
});
