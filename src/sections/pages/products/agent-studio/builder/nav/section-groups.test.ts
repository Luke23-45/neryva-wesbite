import { describe, expect, it } from 'vitest';
import { LANE_NODE_IDS } from '../lib/lane-model';
import { SECTION_GROUPS, allGroupedSectionIds, sectionLabel } from './section-groups';

describe('section-groups', () => {
  it('covers every section id exactly once', () => {
    const grouped = allGroupedSectionIds();
    // 'brain' is soft-deleted from the UI (2026-09-30): LANE_NODE_IDS keeps
    // it for the canvas/v10 implementation, but section-groups must not
    // navigate to it. 'credentials' moved to the Providers page (Phase 6,
    // doc 20 §3.5): the dormant v10 lane spec keeps it, nav does not.
    const navigable = LANE_NODE_IDS.filter((id) => id !== 'brain' && id !== 'credentials');
    expect([...grouped].sort()).toEqual([...navigable].sort());
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
