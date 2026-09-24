/**
 * Regression tests for the key-detail parser (Phase 5, NEW-1 / NEW-2).
 * Fixture: REAL `GET /console/org/:orgId/keys/:keyId` response captured
 * 2026-09-24 against the live harness engine (project-bound key).
 * The engine returns `project_binding` (not `binding`), plus `events`
 * and `days_to_expiry` — the parser must surface all three.
 */
import { describe, expect, it } from 'vitest';
import { parseKeyDetail } from './useStudioKeys';

const BOUND_PROJECT_ID = 'ff719532-6ed0-4230-a985-f5c46214c61d';

const engineDetail = {
  key: {
    id: '2d65e385-a856-4243-b4f6-7c03eb6167d4',
    name: 'bound-key',
    prefix: 'nrv_live_1jZvpqZ2',
    role: 'operator',
    scopes: ['agents:read'],
    revoked: false,
    expires_at: '2026-10-24 12:20:50.44+00',
    days_to_expiry: 30,
    usage_count: 0,
    last_used_at: null,
    project_binding: { project_id: BOUND_PROJECT_ID },
    events: [
      { action: 'key.created', actor_id: '08c2d914-ef60-468b-9d72-4d870df9c7f7', created_at: '2026-09-24 12:21:07.992+00', details: { name: 'bound-key' } },
    ],
  },
};

describe('parseKeyDetail', () => {
  it('surfaces the engine project_binding (NEW-1: was always "Not bound")', () => {
    const parsed = parseKeyDetail(engineDetail);
    expect(parsed).not.toBeNull();
    expect(parsed!.projectId).toBe(BOUND_PROJECT_ID);
  });

  it('keeps the legacy nested.binding shape working as a fallback', () => {
    const parsed = parseKeyDetail({ key: { id: 'x', binding: { project_id: 'legacy-proj' } } });
    expect(parsed!.projectId).toBe('legacy-proj');
  });

  it('yields null projectId when the key is unbound', () => {
    const parsed = parseKeyDetail({ key: { id: 'x', project_binding: null } });
    expect(parsed!.projectId).toBeNull();
  });

  it('surfaces days_to_expiry and the audit events (NEW-2: were dropped)', () => {
    const parsed = parseKeyDetail(engineDetail);
    expect(parsed!.daysToExpiry).toBe(30);
    expect(parsed!.events).toHaveLength(1);
    expect(parsed!.events[0].action).toBe('key.created');
  });

  it('returns null for rows without an id (shared parseX guard)', () => {
    expect(parseKeyDetail({ key: { name: 'no-id' } })).toBeNull();
    expect(parseKeyDetail(null)).toBeNull();
  });
});
