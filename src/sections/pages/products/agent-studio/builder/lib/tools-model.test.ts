/**
 * tools-model ranges green first (C06 PLAN.md §4) — every bound asserted so a
 * future edit cannot silently leave the engine contract. Name-rule parity with
 * both homes (catalog hook + setup-caps) fails loudly on drift.
 */
import { describe, expect, it } from 'vitest';
import {
  approvalMode,
  canBind,
  contractCaps,
  isBuiltinTool,
  moveTool,
  perimeterView,
  pinState,
  repinHash,
  TOOLS_MAX,
  validateCatalogName,
  validateEntries,
  validateToolName,
  ENTRY_NAME_MAX,
  ENTRY_NAME_MIN,
} from './tools-model';
import { CAPS } from '@lib/engine/setup-caps';
import { TOOL_NAME_PATTERN } from '@hooks/studio/useSetupTools';

describe('validateToolName (entry rule — contract, no leading letter)', () => {
  it('accepts 2–64 lowercase/digits/underscores, leading digit or underscore ok', () => {
    expect(validateToolName('lookup_ticket')).toBeNull();
    expect(validateToolName('ab')).toBeNull();
    expect(validateToolName('9lives')).toBeNull();
    expect(validateToolName('_private')).toBeNull();
    expect(validateToolName('a'.repeat(ENTRY_NAME_MAX))).toBeNull();
  });
  it('rejects blank/short/long/unclean', () => {
    expect(validateToolName('')).not.toBeNull();
    expect(validateToolName('a')).not.toBeNull();
    expect(validateToolName('a'.repeat(ENTRY_NAME_MAX + 1))).not.toBeNull();
    expect(validateToolName('has space')).not.toBeNull();
    expect(validateToolName('UPPER')).not.toBeNull();
    expect(validateToolName('has-dash')).not.toBeNull();
  });
  it(`bounds are ${ENTRY_NAME_MIN}–${ENTRY_NAME_MAX}`, () => {
    expect(ENTRY_NAME_MIN).toBe(2);
    expect(ENTRY_NAME_MAX).toBe(64);
  });
});

describe('validateCatalogName (catalog rule — leading letter REQUIRED)', () => {
  it('stays in parity with the catalog hook pattern', () => {
    const samples = ['lookup_ticket', '9lives', '_x', 'ab', 'a', 'UPPER', 'has space', 'x-'.repeat(40)];
    for (const sample of samples) {
      expect(validateCatalogName(sample) === null).toBe(
        TOOL_NAME_PATTERN.test(sample.trim().toLowerCase()),
      );
    }
  });
  it('requires the leading letter the entry rule does not', () => {
    expect(validateCatalogName('9lives')).not.toBeNull();
    expect(validateToolName('9lives')).toBeNull();
  });
});

describe('validateEntries', () => {
  it(`caps at ${TOOLS_MAX} with dedup`, () => {
    expect(validateEntries([{ name: 'a1' }, { name: 'b2' }])).toEqual({ ok: true, names: ['a1', 'b2'] });
    const many = Array.from({ length: TOOLS_MAX + 1 }, (_, i) => ({ name: `t${i}_x` }));
    expect(validateEntries(many).ok).toBe(false);
    expect(validateEntries(Array.from({ length: TOOLS_MAX }, (_, i) => ({ name: `t${i}_x` }))).ok).toBe(true);
  });
  it('rejects bad names and duplicates by name', () => {
    const bad = validateEntries([{ name: 'ok_tool' }, { name: 'bad tool' }]);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.message).toMatch(/bad tool/);
    const dup = validateEntries([{ name: 'same_1' }, { name: 'same_1' }]);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.message).toMatch(/twice/);
  });
  it('mirrors the contract cap single-source', () => {
    expect(TOOLS_MAX).toBe(32);
    expect(contractCaps().toolsMax).toBe(CAPS.toolsMax);
  });
});

describe('canBind', () => {
  it('holds at the cap with a named message', () => {
    expect(canBind(0)).toEqual({ ok: true });
    const held = canBind(TOOLS_MAX);
    expect(held.ok).toBe(false);
    if (!held.ok) expect(held.message).toMatch(/32/);
  });
});

describe('approvalMode (authorize truth + source)', () => {
  it('matches the engine truth table', () => {
    expect(approvalMode('always', 'NONE')).toEqual({ mode: 'required', source: 'entry' });
    expect(approvalMode('always', 'REQUIRED')).toEqual({ mode: 'required', source: 'entry' });
    expect(approvalMode('on_effect', 'REQUIRED')).toEqual({ mode: 'required', source: 'catalog' });
    expect(approvalMode('on_effect', 'NONE')).toEqual({ mode: 'optional', source: 'default' });
    // The fixed cell: catalog REQUIRED escalates even a 'never' entry.
    expect(approvalMode('never', 'REQUIRED')).toEqual({ mode: 'required', source: 'catalog' });
    expect(approvalMode('never', 'NONE')).toEqual({ mode: 'optional', source: 'default' });
    expect(approvalMode('never', null)).toEqual({ mode: 'optional', source: 'default' });
  });
});

describe('pinState', () => {
  const row = { hash: 'a'.repeat(64), version: 'v3', enabled: true as boolean | null };
  it('grades ready/stale/missing/disabled/builtin/unpinned', () => {
    expect(pinState('a'.repeat(64), row, false)).toEqual({ kind: 'ready', version: 'v3' });
    expect(pinState('A'.repeat(64), row, false)).toEqual({ kind: 'ready', version: 'v3' });
    expect(pinState('b'.repeat(64), row, false)).toEqual({ kind: 'stale', liveVersion: 'v3' });
    expect(pinState(undefined, row, false)).toEqual({ kind: 'unpinned' });
    expect(pinState('a'.repeat(64), null, false)).toEqual({ kind: 'missing' });
    expect(pinState('a'.repeat(64), { ...row, enabled: false }, false)).toEqual({ kind: 'disabled' });
    expect(pinState(undefined, null, true)).toEqual({ kind: 'builtin' });
  });
  it('re-pin targets the live hash or nothing', () => {
    expect(repinHash(row)).toBe('a'.repeat(64));
    expect(repinHash(null)).toBeNull();
  });
});

describe('perimeterView', () => {
  it('shows effective environment, never a default claim', () => {
    expect(perimeterView({ executionEnvironment: 'in_process', allowedEgressDomains: null, bindingHost: null }, false)).toEqual({
      kind: 'none',
      reason: 'in_process',
    });
    expect(
      perimeterView(
        { executionEnvironment: 'external_gateway', allowedEgressDomains: ['pay.example'], bindingHost: 'pay.example' },
        false,
      ),
    ).toEqual({ kind: 'egress', environment: 'external_gateway', domains: ['pay.example'], bindingCovered: true });
    const uncovered = perimeterView(
      { executionEnvironment: 'external_gateway', allowedEgressDomains: ['other.example'], bindingHost: 'pay.example' },
      false,
    );
    expect(uncovered.kind).toBe('egress');
    if (uncovered.kind === 'egress') expect(uncovered.bindingCovered).toBe(false);
    // Null row = historical posture, coverage unknown — never invented.
    expect(perimeterView(null, false)).toEqual({ kind: 'egress', environment: 'external_gateway', domains: [], bindingCovered: null });
    expect(perimeterView(null, true)).toEqual({ kind: 'builtin' });
  });
});

describe('moveTool', () => {
  it('reorders bounds-clamped without mutating', () => {
    const names = ['a1', 'b2', 'c3'];
    expect(moveTool(names, 0, 2)).toEqual(['b2', 'c3', 'a1']);
    expect(moveTool(names, 2, -99)).toEqual(['c3', 'a1', 'b2']);
    expect(moveTool(names, 9, 0)).toEqual(names);
    expect(names).toEqual(['a1', 'b2', 'c3']);
  });
});

describe('isBuiltinTool', () => {
  it('matches exact built-in names', () => {
    expect(isBuiltinTool('web_search', ['web_search'])).toBe(true);
    expect(isBuiltinTool('web_search_x', ['web_search'])).toBe(false);
  });
});
