import { describe, expect, it } from 'vitest';
import { parseDraft, parseConfigVersions, parseDelivery } from './useConfigLifecycle';

describe('parseDraft', () => {
  it('parses a camelCase draft row', () => {
    const draft = parseDraft({
      draft: {
        scope: 'policy_set',
        payload: { max_tokens: 100 },
        product: null,
        validationStatus: 'valid',
        validationIssues: [],
        notes: 'n',
      },
    });
    expect(draft).not.toBeNull();
    expect(draft?.payload).toEqual({ max_tokens: 100 });
    expect(draft?.validationStatus).toBe('valid');
    expect(draft?.validationIssues).toEqual([]);
  });

  it('returns an empty draft for missing data', () => {
    expect(parseDraft({ draft: null })).toEqual({ payload: null, validationStatus: null, validationIssues: null });
    expect(parseDraft(null)).toEqual({ payload: null, validationStatus: null, validationIssues: null });
  });
});

describe('parseConfigVersions', () => {
  it('parses the versions envelope', () => {
    const rows = parseConfigVersions({
      versions: [
        { version: 2, payload: { a: 1 }, publishedAt: '2026-09-24T10:00:00Z', publishedBy: 'u1', notes: 'n' },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ version: 2, publishedBy: 'u1' });
  });

  it('survives garbage', () => {
    expect(parseConfigVersions(null)).toEqual([]);
    expect(parseConfigVersions({ versions: [{ nope: true }] })).toEqual([]);
  });
});

describe('parseDelivery', () => {
  it('parses the targets envelope', () => {
    const rows = parseDelivery({
      targets: [{ satellite: 'sat-1', status: 'acked', ackedAt: '2026-09-24T10:00:00Z' }],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ satellite: 'sat-1', status: 'acked' });
  });

  it('survives garbage', () => {
    expect(parseDelivery(null)).toEqual([]);
  });
});
