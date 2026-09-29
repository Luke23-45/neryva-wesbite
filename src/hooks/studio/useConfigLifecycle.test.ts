import { describe, expect, it, vi, beforeEach } from 'vitest';
import { parseDraft, parseConfigVersions, parseDelivery, fetchConfigDelivery, CONFIG_SCOPES, PUBLISHABLE_SCOPES } from './useConfigLifecycle';
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
