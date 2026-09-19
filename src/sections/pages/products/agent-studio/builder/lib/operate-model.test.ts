/**
 * C15 operate-model tests — pure math first (protocol Step 4.1).
 * Binds: PLAN.md §1 (degraded sweep, paused literals, lineage, approvals).
 */
import { describe, expect, it } from 'vitest';
import {
  buildLineage,
  degradedBannerState,
  describeApprovalAge,
  describeApprovalExpiry,
  describePausedRollout,
  pickOperateBanner,
} from './operate-model';

const DAY = 86_400_000;
const NOW = Date.parse('2026-09-18T12:00:00Z');

describe('degradedBannerState', () => {
  it('maps the sweep semantics to banner states', () => {
    expect(degradedBannerState({ degradedUntil: null, disabledAt: null }, NOW)).toBe('none');
    expect(
      degradedBannerState({ degradedUntil: new Date(NOW + 6 * DAY).toISOString(), disabledAt: null }, NOW),
    ).toBe('active');
    expect(
      degradedBannerState({ degradedUntil: new Date(NOW + 12 * 3_600_000).toISOString(), disabledAt: null }, NOW),
    ).toBe('due-24h');
    expect(
      degradedBannerState({ degradedUntil: new Date(NOW - 1000).toISOString(), disabledAt: null }, NOW),
    ).toBe('active');
    expect(
      degradedBannerState({ degradedUntil: new Date(NOW - 1000).toISOString(), disabledAt: '2026-09-18T11:00:00Z' }, NOW),
    ).toBe('past-due-suspended');
    expect(degradedBannerState({ degradedUntil: 'not-a-time', disabledAt: null }, NOW)).toBe('none');
  });
});

describe('describePausedRollout', () => {
  const names = (id: string | null) => (id === 'u1' ? 'Amara' : null);

  it('attributes manual, burn, and legacy pauses verbatim', () => {
    const manual = describePausedRollout({ pausedReason: 'operator', pausedBy: 'u1', pausedAt: '2026-09-12T09:02:00Z', actorName: names });
    expect(manual.kind).toBe('operator');
    expect(manual.headline).toContain('Amara');
    const burn = describePausedRollout({
      pausedReason: 'burn_rate: last-hour $4.20 exceeded threshold $2.00',
      pausedBy: 'u9',
      pausedAt: '2026-09-12T09:02:00Z',
      actorName: names,
    });
    expect(burn.kind).toBe('burn-rate');
    expect(burn.detail).toContain('burn_rate:');
    const legacy = describePausedRollout({ pausedReason: null, pausedBy: null, pausedAt: null, actorName: names });
    expect(legacy.kind).toBe('legacy');
  });
});

describe('pickOperateBanner', () => {
  const steady = {
    disabled: null,
    degraded: 'none' as const,
    degradedReason: null,
    degradedUntil: null,
    paused: null,
    driftAlert: null,
    shadowOnly: false,
  };

  it('shows the single most severe banner with its fix', () => {
    expect(pickOperateBanner(steady)).toBeNull();
    expect(pickOperateBanner({ ...steady, shadowOnly: true })?.tone).toBe('info');
    expect(pickOperateBanner({ ...steady, driftAlert: 'pins moved' })?.tone).toBe('warning');
    const paused = pickOperateBanner({
      ...steady,
      driftAlert: 'pins moved',
      paused: { kind: 'operator' as const, headline: 'Paused by Amara', detail: null },
    });
    expect(paused?.title).toContain('Paused by Amara');
    const degraded = pickOperateBanner({
      ...steady,
      degraded: 'due-24h' as const,
      degradedReason: 'returns-2024',
      paused: { kind: 'operator' as const, headline: 'Paused', detail: null },
    });
    expect(degraded?.tone).toBe('warning');
    expect(degraded?.title).toContain('returns-2024');
    const disabled = pickOperateBanner({
      ...steady,
      disabled: { at: '2026-09-18T11:00:00Z', reason: 'leak' },
      degraded: 'active' as const,
    });
    expect(disabled?.tone).toBe('error');
    expect(disabled?.title).toContain('disabled');
  });
});

describe('buildLineage', () => {
  it('chains parents oldest-first with rollback forks labeled', () => {
    const nodes = buildLineage(
      [
        { id: 'v8', version: 8, status: 'PUBLISHED', parentVersionId: 'v5', rollbackOf: 'v5' },
        { id: 'v5', version: 5, status: 'PUBLISHED', parentVersionId: 'v2', rollbackOf: null },
        { id: 'v6', version: 6, status: 'PUBLISHED', parentVersionId: null, rollbackOf: null },
        { id: 'v7', version: 7, status: 'DRAFT', parentVersionId: 'v6', rollbackOf: null },
      ],
      'v6',
    );
    expect(nodes.map((n) => n.version)).toEqual([5, 6, 7, 8]);
    expect(nodes.find((n) => n.version === 6)?.isActive).toBe(true);
    expect(nodes.find((n) => n.version === 7)?.isDraft).toBe(true);
    expect(nodes.find((n) => n.version === 7)?.parentLabel).toBe('child of v6');
    expect(nodes.find((n) => n.version === 8)?.parentLabel).toBe('restored from v5');
    expect(nodes.find((n) => n.version === 5)?.parentLabel).toBeNull();
  });

  it('treats missing parents as roots, never a crash', () => {
    const nodes = buildLineage(
      [{ id: 'v1', version: 1, status: 'PUBLISHED', parentVersionId: 'gone', rollbackOf: null }],
      null,
    );
    expect(nodes[0].parentLabel).toBeNull();
  });
});

describe('approval urgency', () => {
  it('words expiry and age from listable fields', () => {
    expect(describeApprovalExpiry(null, NOW)).toBe('no expiry');
    expect(describeApprovalExpiry(new Date(NOW - 1000).toISOString(), NOW)).toBe('expired');
    expect(describeApprovalExpiry(new Date(NOW + 42 * 60_000).toISOString(), NOW)).toBe('expires in 42 min');
    expect(describeApprovalExpiry(new Date(NOW + 3 * 3_600_000).toISOString(), NOW)).toBe('expires in 3h');
    expect(describeApprovalExpiry(new Date(NOW + 2 * DAY).toISOString(), NOW)).toBe('expires in 2 days');
    expect(describeApprovalAge(new Date(NOW - 12 * 60_000).toISOString(), NOW)).toBe('waiting 12 min');
    expect(describeApprovalAge(null, NOW)).toBeNull();
  });
});
