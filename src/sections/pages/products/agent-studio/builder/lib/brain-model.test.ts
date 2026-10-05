import { describe, expect, it } from 'vitest';
import {
  ENGINE_RANGES,
  firstBlocker,
  formatStepValue,
  humanizeReason,
  matchPreset,
  MODEL_PRESETS,
  moveModel,
  reasonFix,
  roundToStep,
  subscriptionGateCopy,
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
    expect(ENGINE_RANGES.allowedModelsMax).toBe(20);
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
    expect(reasonFix('subscription_required')).toEqual({ label: 'View subscription options', action: 'billing' });
    expect(humanizeReason('subscription_required')).toBe('subscription required');
    expect(humanizeReason('credential_compromised')).toBe('credential_compromised (derived)');
    expect(humanizeReason('residency_incompatible')).toBe('residency incompatible');
    // Unknown reasons degrade truthfully — never a guessed fix.
    expect(reasonFix('something_new')).toEqual({ label: 'See Providers', action: null });
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

describe('subscriptionGateCopy', () => {
  it('uses the engine label when present', () => {
    expect(subscriptionGateCopy({ requiredProductLabel: 'Pay-as-you-go' })).toBe(
      "Requires Pay-as-you-go — you don't have that.",
    );
  });

  it('degrades to a truthful generic when the label is missing', () => {
    expect(subscriptionGateCopy({ requiredProductLabel: null })).toBe(
      "Requires a subscription — you don't have that.",
    );
    expect(subscriptionGateCopy({})).toBe(
      "Requires a subscription — you don't have that.",
    );
  });
});

describe('slider step quantization (D4)', () => {
  it('rounds float32 artifacts back to the step grid', () => {
    expect(roundToStep(0.8999999761581421, 0.1)).toBe(0.9);
    expect(roundToStep(1.0500000000000003, 0.05)).toBe(1.05);
    expect(roundToStep(0.85, 0.1)).toBe(0.9);
  });

  it('passes clean values through', () => {
    expect(roundToStep(1.2, 0.1)).toBe(1.2);
    expect(roundToStep(0, 0.1)).toBe(0);
    expect(roundToStep(2, 0.1)).toBe(2);
  });

  it('returns non-finite inputs untouched', () => {
    expect(roundToStep(Number.NaN, 0.1)).toBeNaN();
    expect(roundToStep(1, 0)).toBe(1);
  });

  it('formats stepped values without float noise', () => {
    expect(formatStepValue(0.8999999761581421, 0.1)).toBe('0.9');
    expect(formatStepValue(1, 0.1)).toBe('1');
    expect(formatStepValue(0.95, 0.05)).toBe('0.95');
    expect(formatStepValue(2, 1)).toBe('2');
  });
});
