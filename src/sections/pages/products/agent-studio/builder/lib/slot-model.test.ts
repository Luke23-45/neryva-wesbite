import { describe, expect, it } from 'vitest';
import {
  BUILDER_STEP_ANCHORS,
  KIND_META,
  KIND_ORDER,
  resolveInitialSlot,
} from './slot-model';
import { LANE_NODE_IDS } from './lane-model';

/**
 * Shortcut-map lock test (C09 PLAN §12 — the FIRST component that adds a
 * shortcut writes it). Any add/move MUST update this map AND the AgentBuilder
 * keymap in the same change; a test failure here means the two drifted.
 */
describe('shortcut map (locked)', () => {
  it('pins every kind summon key exactly once', () => {
    const shortcuts = KIND_ORDER.map((kind) => KIND_META[kind].shortcut);
    expect(shortcuts).toEqual(['⇧K', 'T', '⇧M', 'G', 'E', 'B', 'S']);
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
  });

  it('keeps KIND_META in sync with KIND_ORDER', () => {
    expect(Object.keys(KIND_META).sort()).toEqual([...KIND_ORDER].sort());
    for (const kind of KIND_ORDER) {
      expect(KIND_META[kind].kind).toBe(kind);
      expect(KIND_META[kind].label.trim()).not.toBe('');
      expect(KIND_META[kind].pass).toMatch(/^C\d{2}$/);
    }
  });

  it('labels the evaluation kind "Evaluation" (v10 §8.4 — matches the section)', () => {
    expect(KIND_META.evaluation.label).toBe('Evaluation');
  });
});

describe('resolveInitialSlot (C15 ?slot= re-entry)', () => {
  it('resolves every fixed node id (v10: no working set — all 16 resolve)', () => {
    for (const id of LANE_NODE_IDS) {
      expect(resolveInitialSlot(id)).toBe(id);
    }
  });

  it('resolves nothing else', () => {
    expect(resolveInitialSlot('nope')).toBeNull();
    expect(resolveInitialSlot('sat:knowledge')).toBeNull();
    expect(resolveInitialSlot(null)).toBeNull();
    expect(resolveInitialSlot(undefined)).toBeNull();
    expect(resolveInitialSlot('')).toBeNull();
  });
});

describe('BUILDER_STEP_ANCHORS (v10 fixed nodes)', () => {
  it('anchors every node id to an editor section', () => {
    for (const id of LANE_NODE_IDS) {
      expect(typeof BUILDER_STEP_ANCHORS[id]).toBe('string');
      expect(BUILDER_STEP_ANCHORS[id].trim()).not.toBe('');
    }
  });

  it('anchors the four new v10 nodes', () => {
    expect(BUILDER_STEP_ANCHORS.instructions).toBe('instructions');
    expect(BUILDER_STEP_ANCHORS.credentials).toBe('credentials');
    expect(BUILDER_STEP_ANCHORS.samples).toBe('samples');
    expect(BUILDER_STEP_ANCHORS.try).toBe('try');
  });
});
