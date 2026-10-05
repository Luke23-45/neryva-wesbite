/**
 * errorCodeLabel — the shared human-label map for engine error codes.
 */
import { describe, expect, it } from 'vitest';
import { ERROR_CODE_LABELS, errorCodeLabel } from './error-code-labels';

describe('errorCodeLabel', () => {
  it('labels every code in the closed engine set', () => {
    expect(errorCodeLabel('401')).toBe('Auth failed');
    expect(errorCodeLabel('403')).toBe('Forbidden');
    expect(errorCodeLabel('429')).toBe('Rate limited');
    expect(errorCodeLabel('5xx')).toBe('Provider errors');
  });

  it('passes unknown codes through verbatim instead of inventing a label', () => {
    expect(errorCodeLabel('418')).toBe('418');
    expect(errorCodeLabel('network_error')).toBe('network_error');
  });

  it('keeps the map and the function in agreement', () => {
    for (const code of Object.keys(ERROR_CODE_LABELS)) {
      expect(errorCodeLabel(code)).toBe(ERROR_CODE_LABELS[code]);
    }
  });
});
