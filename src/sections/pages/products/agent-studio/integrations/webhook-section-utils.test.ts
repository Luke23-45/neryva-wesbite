import { describe, expect, it } from 'vitest';
import { isValidUrl } from './webhook-section-utils';

/**
 * Webhook URL validation — verbatim contract from the dialog-era
 * WebhooksView: the destination must parse as http(s).
 */
describe('isValidUrl', () => {
  it('accepts https and http destinations', () => {
    expect(isValidUrl('https://hooks.example.com/neryva')).toBe(true);
    expect(isValidUrl('http://localhost:8080/hook')).toBe(true);
  });

  it('trims surrounding whitespace before parsing', () => {
    expect(isValidUrl('  https://hooks.example.com/x  ')).toBe(true);
  });

  it('rejects non-url input, empty input, and non-http(s) schemes', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('   ')).toBe(false);
    expect(isValidUrl('ftp://files.example.com/hook')).toBe(false);
    expect(isValidUrl('mailto:ops@example.com')).toBe(false);
  });
});
