/**
 * Paste encoding (C05 PLAN.md §5) — pasted text becomes a File through the same
 * session flow; the encoding itself is pure and asserted here.
 */
import { describe, expect, it } from 'vitest';
import { encodePasteFile, PASTE_UPLOAD_TYPES } from './useAttachmentUpload';

describe('encodePasteFile', () => {
  it('names the file <slug>.<ext> with the declared type', () => {
    const file = encodePasteFile('{"a":1}', 'pricing-tiers', 'application/json');
    expect(file.name).toBe('pricing-tiers.json');
    expect(file.type).toBe('application/json');
  });

  it('falls back to a shippable stem on blank slugs', () => {
    const file = encodePasteFile('hello', '  ', 'text/plain');
    expect(file.name).toBe('pasted-source.txt');
  });

  it('covers the four paste types only (binaries stay upload-only)', () => {
    expect([...PASTE_UPLOAD_TYPES]).toEqual(['text/plain', 'text/markdown', 'text/csv', 'application/json']);
  });
});
