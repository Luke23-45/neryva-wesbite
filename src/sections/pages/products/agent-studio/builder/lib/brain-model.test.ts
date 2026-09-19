import { describe, expect, it } from 'vitest';
import {
  ENGINE_RANGES,
  firstBlocker,
  humanizeReason,
  matchPreset,
  MODEL_PRESETS,
  moveModel,
  reasonFix,
  usableRefs,
  validateOutputSchema,
} from './brain-model';

describe('brain model (C04 binds)', () => {
  it('pins every preset inside engine ranges (a future edit cannot leave silently)', () => {
    expect(MODEL_PRESETS.map((p) => p.id)).toEqual(['clerk', 'scholar', 'creator']);
    for (const preset of MODEL_PRESETS) {
      const { temperature, top_p, max_output_tokens, reasoning_effort } = preset.params;
      expect(temperature).toBeGreaterThanOrEqual(ENGINE_RANGES.temperature.min);
      expect(temperature).toBeLessThanOrEqual(ENGINE_RANGES.temperature.max);
      expect(top_p).toBeGreaterThan(ENGINE_RANGES.topP.min);
      expect(top_p).toBeLessThanOrEqual(ENGINE_RANGES.topP.max);
      expect(max_output_tokens).toBeGreaterThanOrEqual(ENGINE_RANGES.maxOutputTokens.min);
      expect(max_output_tokens).toBeLessThanOrEqual(ENGINE_RANGES.maxOutputTokens.max);
      expect(['low', 'medium', 'high']).toContain(reasoning_effort);
    }
    expect(ENGINE_RANGES.allowedModelsMax).toBe(16);
  });

  it('matches presets by exact params (badge is computed, never stored)', () => {
    expect(matchPreset({ temperature: 0.7, top_p: 1, max_output_tokens: 16000, reasoning_effort: 'high' })?.id).toBe(
      'scholar',
    );
    expect(matchPreset({ temperature: 0.7, top_p: 0.9, max_output_tokens: 16000, reasoning_effort: 'high' })).toBe(null);
    expect(matchPreset({})).toBe(null);
  });

  it('maps every engine reason to one inline fix, derived labeled as derived', () => {
    expect(reasonFix('provider_credential_missing')).toEqual({ label: 'Connect a credential', action: 'connect' });
    expect(reasonFix('provider_not_enabled')).toEqual({ label: 'Ask an admin to enable', action: 'enable' });
    expect(reasonFix('residency_incompatible')).toEqual({ label: 'Switch profile', action: 'profile' });
    expect(reasonFix('credential_compromised')).toEqual({ label: 'Rotate the key', action: 'incident' });
    expect(humanizeReason('credential_compromised')).toBe('credential_compromised (derived)');
    expect(humanizeReason('residency_incompatible')).toBe('residency incompatible');
    // Unknown reasons degrade truthfully — never a guessed fix.
    expect(reasonFix('something_new')).toEqual({ label: 'See Models library', action: null });
    expect(humanizeReason('something_new')).toBe('something_new');
  });

  it('gates usability on the catalog without guessing', () => {
    const catalog = [
      { ref: 'a/good', usable: true, reasons: [] as string[] },
      { ref: 'b/bad', usable: false, reasons: ['provider_credential_missing'] },
    ];
    expect(usableRefs(['a/good', 'b/bad', 'c/gone'], catalog)).toEqual(['a/good']);
    expect(usableRefs(['a/good'], null)).toEqual([]);
    expect(usableRefs(['a/good'], undefined)).toEqual([]);
    expect(firstBlocker(['a/good', 'b/bad'], catalog)).toEqual({ ref: 'b/bad', reason: 'provider_credential_missing' });
    expect(firstBlocker(['c/gone'], catalog)).toEqual({ ref: 'c/gone', reason: null });
    expect(firstBlocker(['a/good'], catalog)).toBe(null);
    expect(firstBlocker(['a/good'], null)).toBe(null);
  });

  it('reorders the fallback chain with bounds clamping, never mutating', () => {
    const refs = ['a/x', 'b/y', 'c/z'];
    expect(moveModel(refs, 0, 2)).toEqual(['b/y', 'c/z', 'a/x']);
    expect(moveModel(refs, 2, 0)).toEqual(['c/z', 'a/x', 'b/y']);
    expect(moveModel(refs, 5, 0)).toEqual(refs);
    expect(moveModel(refs, 0, 99)).toEqual(['b/y', 'c/z', 'a/x']);
    expect(moveModel(refs, 1, 1)).toEqual(refs);
    expect(refs).toEqual(['a/x', 'b/y', 'c/z']);
  });

  it('gates output schemas locally (caps does not cover them)', () => {
    expect(validateOutputSchema('')).toEqual({ ok: true });
    expect(validateOutputSchema('{"type":"object"}')).toEqual({ ok: true });
    expect(validateOutputSchema('{nope')).toEqual({
      ok: false,
      message: 'Not valid JSON — the engine requires a JSON object schema.',
    });
    expect(validateOutputSchema('[1,2]')).toEqual({
      ok: false,
      message: 'Must be a JSON object schema, not an array or primitive.',
    });
    expect(validateOutputSchema('x'.repeat(16385)).ok).toBe(false);
  });
});
