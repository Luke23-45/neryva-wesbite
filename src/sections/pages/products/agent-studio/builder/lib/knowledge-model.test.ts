/**
 * knowledge-model ranges green first (C05 PLAN.md §4) — every bound asserted so
 * a future edit cannot silently leave the engine contract. Includes parity with
 * setup-caps checkSourceSlug (the same rule, two homes — drift fails loudly).
 */
import { describe, expect, it } from 'vitest';
import {
  canPin,
  coverageLabel,
  documentStateLabel,
  isSessionStalled,
  matchPinToDocument,
  MAX_RESULTS_DEFAULT,
  MAX_RESULTS_MAX,
  MAX_RESULTS_MIN,
  PINS_MAX,
  SESSION_STALL_AFTER_MS,
  sessionStateLabel,
  slugifyFilename,
  SLUG_MAX,
  SLUG_MIN,
  TITLE_MAX,
  validateMaxResults,
  validatePaste,
  validatePins,
  validateSourceSlug,
  validateTitle,
} from './knowledge-model';
import { checkSourceSlug } from '@lib/engine/setup-caps';

describe('validateSourceSlug', () => {
  it('accepts kebab 3–64', () => {
    expect(validateSourceSlug('refund-policy')).toBeNull();
    expect(validateSourceSlug('abc')).toBeNull();
    expect(validateSourceSlug('a'.repeat(SLUG_MAX))).toBeNull();
  });
  it('rejects short/long/unclean', () => {
    expect(validateSourceSlug('ab')).not.toBeNull();
    expect(validateSourceSlug('a'.repeat(SLUG_MAX + 1))).not.toBeNull();
    expect(validateSourceSlug('-lead')).not.toBeNull();
    expect(validateSourceSlug('trail-')).not.toBeNull();
    expect(validateSourceSlug('UPPER')).toBeNull(); // normalized before check
    expect(validateSourceSlug('has space')).not.toBeNull();
    expect(validateSourceSlug('has_underscore')).not.toBeNull();
  });
  it('stays in parity with setup-caps checkSourceSlug', () => {
    const samples = ['refund-policy', 'ab', 'a'.repeat(65), '-x', 'x-', 'ok-1', 'UPPER', 'a b', '', 'doc-'];
    for (const sample of samples) {
      expect(validateSourceSlug(sample) === null).toBe(checkSourceSlug(sample) === null);
    }
  });
  it(`bounds are ${SLUG_MIN}–${SLUG_MAX}`, () => {
    expect(SLUG_MIN).toBe(3);
    expect(SLUG_MAX).toBe(64);
  });
});

describe('slugifyFilename', () => {
  it('derives kebab intents, empty when underivable', () => {
    expect(slugifyFilename('Refund Policy 2026.pdf')).toBe('refund-policy-2026');
    expect(slugifyFilename('faq_2026.md')).toBe('faq-2026');
    expect(slugifyFilename('ab.txt')).toBe('');
    expect(slugifyFilename('!!!.pdf')).toBe('');
  });
});

describe('validateTitle', () => {  it(`accepts ≤ ${TITLE_MAX}`, () => {
    expect(validateTitle('Refund policy 2026')).toBeNull();
    expect(validateTitle('')).toBeNull();
    expect(validateTitle('t'.repeat(TITLE_MAX))).toBeNull();
    expect(validateTitle('t'.repeat(TITLE_MAX + 1))).not.toBeNull();
  });
});

describe('validatePaste', () => {
  it('accepts the four text types', () => {
    for (const mediaType of ['text/plain', 'text/markdown', 'text/csv', 'application/json'] as const) {
      const payload = mediaType === 'application/json' ? '{"a":1}' : 'hello';
      expect(validatePaste(payload, mediaType)).toEqual({ ok: true, mediaType });
    }
  });
  it('rejects binary types with the upload redirect', () => {
    expect(validatePaste('x', 'application/pdf')).toEqual({
      ok: false,
      message: expect.stringMatching(/upload/i),
    });
  });
  it('rejects empty paste', () => {
    expect(validatePaste('   ', 'text/plain').ok).toBe(false);
  });
  it('guards JSON with a named message', () => {
    expect(validatePaste('{broken', 'application/json')).toEqual({
      ok: false,
      message: expect.stringMatching(/valid JSON/i),
    });
  });
});

describe('validatePins', () => {
  it(`caps at ${PINS_MAX} with dedup`, () => {
    expect(validatePins(['a-1', 'b-2', 'a-1'])).toEqual({ ok: true, slugs: ['a-1', 'b-2'] });
    const many = Array.from({ length: PINS_MAX + 1 }, (_, i) => `pin-${i}`);
    expect(validatePins(many).ok).toBe(false);
    expect(validatePins(Array.from({ length: PINS_MAX }, (_, i) => `pin-${i}`)).ok).toBe(true);
  });
  it('rejects bad slugs by name', () => {
    const result = validatePins(['good-slug', 'bad slug']);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/bad slug/);
  });
  it('drops blanks', () => {
    expect(validatePins(['', '  '])).toEqual({ ok: true, slugs: [] });
  });
});

describe('canPin', () => {
  it('holds at the cap with a named message', () => {
    expect(canPin(3)).toEqual({ ok: true });
    const held = canPin(PINS_MAX);
    expect(held.ok).toBe(false);
    if (!held.ok) expect(held.message).toMatch(new RegExp(String(PINS_MAX)));
  });
});

describe('validateMaxResults', () => {
  it(`accepts integers ${MAX_RESULTS_MIN}–${MAX_RESULTS_MAX}, default ${MAX_RESULTS_DEFAULT}`, () => {
    expect(validateMaxResults(1)).toEqual({ ok: true, value: 1 });
    expect(validateMaxResults(20)).toEqual({ ok: true, value: 20 });
    expect(validateMaxResults(0).ok).toBe(false);
    expect(validateMaxResults(21).ok).toBe(false);
    expect(validateMaxResults(2.5).ok).toBe(false);
    expect(validateMaxResults('5').ok).toBe(false);
    expect(MAX_RESULTS_DEFAULT).toBe(5);
    expect(MAX_RESULTS_MIN).toBe(1);
    expect(MAX_RESULTS_MAX).toBe(20);
  });
});

describe('matchPinToDocument', () => {
  const inventory = [{ id: 'd1', sourceSlug: 'refund-policy', title: 'Refund', state: 'ready', latestVersion: 3 }];
  it('resolves by slug', () => {
    expect(matchPinToDocument('refund-policy', inventory)).toEqual({ resolved: true, document: inventory[0] });
  });
  it('names unresolved slugs', () => {
    expect(matchPinToDocument('ghost-slug', inventory)).toEqual({ resolved: false, slug: 'ghost-slug' });
  });
});

describe('sessionStateLabel', () => {
  it('covers all nine engine states with fix paths', () => {
    for (const state of [
      'CREATED',
      'UPLOADING',
      'UPLOADED',
      'SCANNING',
      'EXTRACTING',
      'INDEXING',
      'READY',
      'QUARANTINED',
      'FAILED',
    ]) {
      const label = sessionStateLabel(state);
      expect(label.word).toBeTruthy();
      expect(label.fix).toBeTruthy();
    }
    expect(sessionStateLabel('READY').tone).toBe('success');
    expect(sessionStateLabel('QUARANTINED').fix).toMatch(/No retry/i);
    expect(sessionStateLabel('FAILED').fix).toMatch(/No retry/i);
    expect(sessionStateLabel('UPLOADED').fix).toMatch(/pipeline still scans/i);
  });
  it('degrades unknown states truthfully', () => {
    expect(sessionStateLabel('BOGUS').word).toBe('BOGUS');
  });
});

describe('isSessionStalled', () => {
  it('flags non-terminal sessions past the lease, never terminal ones', () => {
    const now = Date.now();
    expect(isSessionStalled('INDEXING', now - SESSION_STALL_AFTER_MS - 1, now)).toBe(true);
    expect(isSessionStalled('INDEXING', now - 1000, now)).toBe(false);
    expect(isSessionStalled('READY', now - SESSION_STALL_AFTER_MS - 1, now)).toBe(false);
    expect(isSessionStalled('FAILED', now - SESSION_STALL_AFTER_MS - 1, now)).toBe(false);
    expect(isSessionStalled('INDEXING', null, now)).toBe(false);
  });
});

describe('documentStateLabel', () => {
  it('covers the four document states', () => {
    expect(documentStateLabel('ready').tone).toBe('success');
    expect(documentStateLabel('processing').tone).toBe('info');
    expect(documentStateLabel('failed').tone).toBe('error');
    expect(documentStateLabel('retired').tone).toBe('warning');
    expect(documentStateLabel('retired').hint).toMatch(/tombstone/i);
  });
});

describe('coverageLabel', () => {
  it('names the model in every state — READY document ≠ covered', () => {
    expect(coverageLabel('ready', 'm').word).toBe('ready-for-retrieval');
    expect(coverageLabel('re-embedding', 'm').word).toBe('re-embedding-in-progress');
    const incomplete = coverageLabel('incomplete', 'local-lexical-v1');
    expect(incomplete.word).toBe('coverage-incomplete');
    expect(incomplete.detail).toMatch(/local-lexical-v1/);
  });
});
