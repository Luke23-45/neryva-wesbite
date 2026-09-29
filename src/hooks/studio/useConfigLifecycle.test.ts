import { describe, expect, it, vi, beforeEach } from 'vitest';
import { normalizeProduct, productError, parseDraft, parseConfigVersions, parseDelivery, fetchConfigDelivery, buildRenotifyRequest, CONFIG_SCOPES, PUBLISHABLE_SCOPES } from './useConfigLifecycle';
import { engine } from '@lib/engine/client';

vi.mock('@lib/engine/client', () => ({ engine: vi.fn() }));
vi.mock('@/Context/OrgContext', () => ({ useOrg: () => ({ orgId: 'org-1' }) }));

const mockEngine = vi.mocked(engine);

beforeEach(() => {
  mockEngine.mockReset();
});

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
    expect(draft?.notes).toBe('n');
  });

  it('returns an empty draft for missing data', () => {
    expect(parseDraft({ draft: null })).toEqual({ payload: null, validationStatus: null, validationIssues: null, notes: null });
    expect(parseDraft(null)).toEqual({ payload: null, validationStatus: null, validationIssues: null, notes: null });
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

describe('fetchConfigDelivery', () => {
  it('maps a 404 (nothing published) to the empty targets shape', async () => {
    const err = Object.assign(new Error('config version not found'), { status: 404 });
    mockEngine.mockRejectedValueOnce(err);
    const raw = await fetchConfigDelivery('org-1', 'policy_set');
    expect(raw).toEqual({ targets: [] });
    expect(parseDelivery(raw)).toEqual([]);
  });

  it('rethrows non-404 errors', async () => {
    const err = Object.assign(new Error('boom'), { status: 500 });
    mockEngine.mockRejectedValueOnce(err);
    await expect(fetchConfigDelivery('org-1', 'policy_set')).rejects.toThrow('boom');
  });
});

describe('parseDelivery', () => {
  it('derives delivery state from ackedAt, not satelliteStatus (C-P0-12)', () => {
    // The engine's real wire shape: satelliteStatus is the lease state
    // (live|stale|offline|never|unknown) — never 'acked'.
    const rows = parseDelivery({
      targets: [
        { satelliteKey: 'sat-acked', satelliteStatus: 'live', notifiedAt: '2026-09-24T09:00:00Z', ackedAt: '2026-09-24T10:00:00Z' },
        { satelliteKey: 'sat-stale-acked', satelliteStatus: 'stale', notifiedAt: '2026-09-24T09:00:00Z', ackedAt: '2026-09-24T10:05:00Z' },
        { satelliteKey: 'sat-pending', satelliteStatus: 'live', notifiedAt: '2026-09-24T09:00:00Z', ackedAt: null },
        { satelliteKey: 'sat-offline', satelliteStatus: 'offline', notifiedAt: '2026-09-24T09:00:00Z', ackedAt: null },
      ],
    });
    expect(rows).toHaveLength(4);
    // ACKed rows are 'acked' even when the lease state is stale.
    expect(rows[0]).toMatchObject({ satellite: 'sat-acked', deliveryStatus: 'acked', satelliteStatus: 'live', ackedAt: '2026-09-24T10:00:00Z' });
    expect(rows[1]).toMatchObject({ satellite: 'sat-stale-acked', deliveryStatus: 'acked', satelliteStatus: 'stale' });
    // Unacked rows are 'pending' — regardless of lease state.
    expect(rows[2]).toMatchObject({ satellite: 'sat-pending', deliveryStatus: 'pending', satelliteStatus: 'live', ackedAt: null });
    expect(rows[3]).toMatchObject({ satellite: 'sat-offline', deliveryStatus: 'pending', satelliteStatus: 'offline' });
  });

  it('survives garbage', () => {
    expect(parseDelivery(null)).toEqual([]);
  });
});

describe('config scopes (C-P0-13)', () => {
  it('offers only the scopes with a live consumer for publish', () => {
    // model_catalog and knowledge_config are the only scopes
    // configPublish.latest() is ever called with engine-wide.
    expect([...PUBLISHABLE_SCOPES]).toEqual(['model_catalog', 'knowledge_config']);
    for (const s of PUBLISHABLE_SCOPES) {
      expect(CONFIG_SCOPES).toContain(s);
    }
  });

  it('does not offer the scopes nothing consumes', () => {
    for (const s of ['policy_set', 'guardrail_profile', 'quota_profile']) {
      expect(CONFIG_SCOPES).toContain(s); // still valid engine vocabulary
      expect(PUBLISHABLE_SCOPES).not.toContain(s);
    }
  });
});

describe('product normalization (C-16)', () => {
  it('accepts valid tags and trims whitespace without changing the key', () => {
    // The engine validates product strictly against ^[a-z0-9_]{1,64}$
    // (config-publish.controller.ts) — the console must never silently
    // rewrite the key (e.g. lowercase it), or reads/writes would land on a
    // different product than the operator typed.
    expect(normalizeProduct('my_product')).toBe('my_product');
    expect(normalizeProduct('  ok_tag1  ')).toBe('ok_tag1');
  });

  it('treats empty/missing as the org-level config', () => {
    expect(normalizeProduct('')).toBeNull();
    expect(normalizeProduct('   ')).toBeNull();
    expect(normalizeProduct(null)).toBeNull();
    expect(normalizeProduct(undefined)).toBeNull();
    expect(productError('')).toBeNull();
    expect(productError(null)).toBeNull();
  });

  it('rejects invalid tags with an honest message instead of rewriting them', () => {
    expect(productError('My Product')).toMatch(/lowercase/);
    expect(productError('My_Product')).toMatch(/lowercase/);
    expect(productError('a'.repeat(65))).toMatch(/64/);
    expect(productError('no-dashes')).toMatch(/lowercase/);
  });
});

describe('config notes (C-13)', () => {
  it('parseConfigVersions reads the audit notes', () => {
    const rows = parseConfigVersions({
      versions: [{ version: 1, publishedAt: '2026-09-24T10:00:00Z', publishedBy: 'u1', notes: 'rolled back bad policy' }],
    });
    expect(rows[0].notes).toBe('rolled back bad policy');
  });

  it('treats missing notes as null', () => {
    const rows = parseConfigVersions({ versions: [{ version: 1, publishedAt: '2026-09-24T10:00:00Z' }] });
    expect(rows[0].notes).toBeNull();
  });

  it('parseDraft reads the draft notes', () => {
    const draft = parseDraft({ draft: { scope: 'model_catalog', payload: {}, notes: 'why this draft changes' } });
    expect(draft.notes).toBe('why this draft changes');
  });
});

describe('re-notify request (C-18)', () => {
  it('targets the engine re-fanout endpoint with scope + product', () => {
    // Engine: POST console/org/:orgId/config/delivery/re-notify
    // (config-publish.controller.ts) — re-fanout for the latest version of
    // the key; {scope} alone re-notifies the org-level config.
    expect(buildRenotifyRequest('org-1', 'model_catalog', 'my_product')).toEqual({
      path: '/console/org/org-1/config/delivery/re-notify',
      body: { scope: 'model_catalog', product: 'my_product' },
    });
  });

  it('omits product for the org-level config', () => {
    expect(buildRenotifyRequest('org-1', 'knowledge_config', null)).toEqual({
      path: '/console/org/org-1/config/delivery/re-notify',
      body: { scope: 'knowledge_config' },
    });
  });
});
