import { describe, expect, it } from 'vitest';
import { KIND_META, KIND_ORDER, SKIPPABLE_KINDS, defaultSatellites, resolveInitialSlot } from './slot-model';

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

  it('binds every kind by default and skips only the skippable', () => {
    const satellites = defaultSatellites();
    for (const kind of KIND_ORDER) {
      expect(satellites.some((sat) => sat.kind === kind)).toBe(true);
    }
    expect([...SKIPPABLE_KINDS].sort()).toEqual(['evaluation', 'knowledge', 'memory', 'tools']);
    // Platform defaults are runtime truth — budget joins guardrails/brand as unskippable.
    expect(SKIPPABLE_KINDS.has('budget')).toBe(false);
    expect(SKIPPABLE_KINDS.has('guardrails')).toBe(false);
    expect(SKIPPABLE_KINDS.has('brand')).toBe(false);
  });
});

describe('resolveInitialSlot (C15 ?slot= re-entry)', () => {
  const sats = [{ id: 'sat:knowledge', kind: 'knowledge' }, { id: 'sat:new', kind: null }];

  it('resolves spines always, bound kinds by instance, nothing else', () => {
    expect(resolveInitialSlot('brain', sats)).toBe('brain');
    expect(resolveInitialSlot('ship', sats)).toBe('ship');
    expect(resolveInitialSlot('knowledge', sats)).toBe('sat:knowledge');
    expect(resolveInitialSlot('tools', sats)).toBeNull();
    expect(resolveInitialSlot('nope', sats)).toBeNull();
    expect(resolveInitialSlot(null, sats)).toBeNull();
    expect(resolveInitialSlot('', sats)).toBeNull();
  });
});
