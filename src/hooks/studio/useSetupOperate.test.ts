import { describe, expect, it } from 'vitest';
import { parseRollout, parseControlBlocks, parseRollups, BLOCK_TARGETS, isBlockActive, describeBlockExpiry, matchTemplateBlock, filterBlocks, BLOCK_EXPIRING_WITHIN_DAYS } from './useSetupOperate';

describe('parseRollout', () => {
  it('reads rollout/release rows with pause attribution (camelCase and snake_case)', () => {
    const rollout = parseRollout({
      rollout: {
        id: 'ro1',
        state: 'paused',
        environment: 'production',
        channel: 'default',
        versions: [{ version_id: 'v1', weight: 100 }],
        paused_reason: 'burn-rate auto-pause',
        paused_by: 'burn-rate',
        paused_at: '2026-09-16T10:00:00Z',
      },
    });
    expect(rollout).toMatchObject({
      id: 'ro1',
      state: 'paused',
      pausedReason: 'burn-rate auto-pause',
      pausedBy: 'burn-rate',
      variants: [{ version_id: 'v1', weight: 100 }],
    });
  });

  it('returns null when no rollout exists (never invent one)', () => {
    expect(parseRollout({ rollout: null })).toBeNull();
    expect(parseRollout({})).toBeNull();
  });

  it('drops malformed variants', () => {
    const rollout = parseRollout({ rollout: { state: 'active', versions: [{ version_id: '', weight: 50 }, { weight: 50 }, null] } });
    expect(rollout?.variants).toEqual([]);
  });
});

describe('parseControlBlocks', () => {
  it('reads blocks with mandatory reason', () => {
    const rows = parseControlBlocks({ blocks: [{ id: 'b1', target_type: 'assistant', target_name: 'a1', reason: 'incident-1' }] });
    expect(rows).toEqual([{ id: 'b1', targetType: 'assistant', targetName: 'a1', reason: 'incident-1', expiresAt: null, createdBy: null, createdAt: null }]);
  });

  it('covers exactly the engine target vocabulary', () => {
    expect([...BLOCK_TARGETS].sort()).toEqual(['assistant', 'capability', 'template', 'tool', 'version'].sort());
  });
});

describe('isBlockActive', () => {
  const NOW = new Date('2026-09-17T12:00:00Z').getTime();
  it('treats null/unparseable expiry as active (fail-closed like the engine)', () => {
    expect(isBlockActive({ expiresAt: null }, NOW)).toBe(true);
    expect(isBlockActive({ expiresAt: 'not-a-date' }, NOW)).toBe(true);
  });

  it('computes active/expired against the given clock', () => {
    expect(isBlockActive({ expiresAt: '2026-09-18T12:00:00Z' }, NOW)).toBe(true);
    expect(isBlockActive({ expiresAt: '2026-09-16T12:00:00Z' }, NOW)).toBe(false);
  });
});

describe('describeBlockExpiry', () => {
  it('names the state in plain words', () => {
    expect(describeBlockExpiry(null)).toBe('no expiry');
    expect(describeBlockExpiry('not-a-date')).toBe('no expiry');
    expect(describeBlockExpiry(new Date(Date.now() - 1000).toISOString())).toBe('expired');
    expect(describeBlockExpiry(new Date(Date.now() + 3 * 86_400_000).toISOString())).toBe('expires in 3 days');
  });
  it('never says "expires tomorrow" for sub-day expiries', () => {
    expect(describeBlockExpiry(new Date(Date.now() + 90_000).toISOString())).toBe('expires in 2 min');
    expect(describeBlockExpiry(new Date(Date.now() + 30 * 60_000).toISOString())).toBe('expires in 30 min');
    expect(describeBlockExpiry(new Date(Date.now() + 5 * 3_600_000).toISOString())).toBe('expires in 5 h');
    expect(describeBlockExpiry(new Date(Date.now() + 23 * 3_600_000).toISOString())).toBe('expires in 23 h');
    expect(describeBlockExpiry(new Date(Date.now() + 24 * 3_600_000).toISOString())).toBe('expires tomorrow');
  });
});

describe('filterBlocks', () => {
  const NOW = new Date('2026-09-17T12:00:00Z').getTime();
  const rows = parseControlBlocks({
    blocks: [
      { id: 'b1', target_type: 'tool', target_name: 'refund-payment', reason: 'credential rotation', expires_at: '2026-09-20T12:00:00Z', created_by: 'ava@acme.co', created_at: '2026-09-10T00:00:00Z' },
      { id: 'b2', target_type: 'template', target_name: 'support-starter', reason: 'legal hold', created_by: 'li@acme.co', created_at: '2026-05-28T00:00:00Z' },
      { id: 'b3', target_type: 'capability', target_name: 'web-browse', reason: 'incident containment', expires_at: '2026-09-01T00:00:00Z' },
      { id: 'b4', target_type: 'tool', target_name: 'export-report', reason: 'quarterly freeze', expires_at: '2026-12-01T00:00:00Z' },
    ],
  });

  it('filters by target', () => {
    expect(filterBlocks(rows, { target: 'tool', status: 'all', query: '' }, NOW).map((b) => b.id)).toEqual(['b1', 'b4']);
  });

  it('splits active/expiring/expired/permanent without re-deriving liveness', () => {
    expect(BLOCK_EXPIRING_WITHIN_DAYS).toBe(7);
    expect(filterBlocks(rows, { target: 'all', status: 'active', query: '' }, NOW).map((b) => b.id)).toEqual(['b1', 'b2', 'b4']);
    expect(filterBlocks(rows, { target: 'all', status: 'expiring', query: '' }, NOW).map((b) => b.id)).toEqual(['b1']);
    expect(filterBlocks(rows, { target: 'all', status: 'expired', query: '' }, NOW).map((b) => b.id)).toEqual(['b3']);
    expect(filterBlocks(rows, { target: 'all', status: 'permanent', query: '' }, NOW).map((b) => b.id)).toEqual(['b2']);
  });

  it('searches name and reason case-insensitively', () => {
    expect(filterBlocks(rows, { target: 'all', status: 'all', query: 'LEGAL' }, NOW).map((b) => b.id)).toEqual(['b2']);
    expect(filterBlocks(rows, { target: 'all', status: 'all', query: 'refund' }, NOW).map((b) => b.id)).toEqual(['b1']);
  });
});

describe('matchTemplateBlock', () => {
  const NOW = new Date('2026-09-17T12:00:00Z').getTime();
  const rows = parseControlBlocks({
    blocks: [
      { id: 'b1', target_type: 'template', target_name: 'support@1.0.0', reason: 'bad release' },
      { id: 'b2', target_type: 'template', target_name: 'sales', reason: 'whole family paused' },
      { id: 'b3', target_type: 'assistant', target_name: 'support@1.0.0', reason: 'not a template row' },
      { id: 'b4', target_type: 'template', target_name: 'old', reason: 'lapsed', expires_at: '2026-09-01T00:00:00Z' },
    ],
  });

  it('prefers the exact slug@version match over the bare slug', () => {
    expect(matchTemplateBlock(rows, 'support', '1.0.0', NOW)?.id).toBe('b1');
    expect(matchTemplateBlock(rows, 'sales', '9.9.9', NOW)?.id).toBe('b2');
  });

  it('ignores non-template targets and expired rows', () => {
    expect(matchTemplateBlock(rows, 'old', '1.0.0', NOW)).toBeNull();
    expect(matchTemplateBlock(rows, 'missing', '1.0.0', NOW)).toBeNull();
  });
});

describe('parseRollups', () => {
  it('reads rollup rows with metrics intact (nulls preserved, never zero-filled)', () => {
    const rows = parseRollups({
      rollups: [{ kind: 'assistant_outcomes_daily', period_start: '2026-09-16', scope: { assistant_id: 'a1' }, metrics: { completed: 9, containment: null } }],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].metrics).toMatchObject({ completed: 9, containment: null });
  });

  it('drops rows without kinds', () => {
    expect(parseRollups({ rollups: [{ metrics: {} }] })).toEqual([]);
  });
});
