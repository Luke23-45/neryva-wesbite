import { describe, expect, it } from 'vitest';
import { DESCRIPTION_MAX, isDescriptionValid, isNameValid, NAME_MAX, suggestRename } from './purpose-model';

describe('purpose model (C01 binds)', () => {
  it('enforces the engine name/description limits', () => {
    expect(isNameValid('')).toBe(false);
    expect(isNameValid('A')).toBe(false);
    expect(isNameValid('Ab')).toBe(true);
    expect(isNameValid('  Ab  ')).toBe(true);
    expect(isNameValid('x'.repeat(NAME_MAX))).toBe(true);
    expect(isNameValid('x'.repeat(NAME_MAX + 1))).toBe(false);
    expect(isDescriptionValid('x'.repeat(DESCRIPTION_MAX))).toBe(true);
    expect(isDescriptionValid('x'.repeat(DESCRIPTION_MAX + 1))).toBe(false);
  });

  it('measures the trimmed description against the 512 cap (19-24)', () => {
    // The wire sends desc.trim(): padding must not consume the budget or
    // reject input the engine would accept.
    expect(isDescriptionValid(`  ${'x'.repeat(510)}  `)).toBe(true);
    expect(isDescriptionValid(`\n${'x'.repeat(DESCRIPTION_MAX)}\t`)).toBe(true);
    expect(isDescriptionValid(`  ${'x'.repeat(DESCRIPTION_MAX + 1)}  `)).toBe(false);
    expect(isDescriptionValid('   ')).toBe(true);
  });

  it('suggests the next free name in one tap', () => {
    expect(suggestRename('Billing')).toBe('Billing 2');
    expect(suggestRename('Billing 2')).toBe('Billing 3');
    expect(suggestRename('  Billing 9  ')).toBe('Billing 10');
  });
});
