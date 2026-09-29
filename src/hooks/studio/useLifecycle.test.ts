/**
 * useLifecycle pure-function tests (D1 compliance patch wave: C-04, C-05, C-06, C-07, C-08).
 *
 * Covers the parsers and request builders the ComplianceView renders —
 * expiresAt/downloadCount reach the export model, holds read the wire
 * `placedAt` field, hold scope/placed-by fields parse, the one-time
 * download token is extracted from the create envelope, and the
 * governance dialogs validate against the engine DTO vocabularies.
 * Pure: no network, no DOM. Hook wiring itself is exercised in the browser.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  parseExports,
  parseLegalHolds,
  parseExportRequest,
  parseExportToken,
  parsePurgeTask,
  parseTombstone,
  buildHoldBody,
  buildPurgeBody,
  buildRetentionPolicyBody,
  HOLD_SCOPE_TYPES,
  PURGE_SCOPE_TYPES,
  PURGE_REASONS,
} from './useLifecycle';
import { engine } from '@lib/engine/client';

vi.mock('@lib/engine/client', () => ({ engine: vi.fn(), engineDownload: vi.fn() }));
vi.mock('@/Context/OrgContext', () => ({ useOrg: () => ({ orgId: 'org-1' }) }));

const mockEngine = vi.mocked(engine);

beforeEach(() => {
  mockEngine.mockReset();
});

const UUID = '123e4567-e89b-12d3-a456-426614174000';

// ── C-04: expiresAt / downloadCount reach the UI model ─────────────────────

describe('parseExports', () => {
  it('parses the camelCase export_requests envelope', () => {
    const rows = parseExports({
      export_requests: [
        {
          id: 'e1',
          state: 'ready',
          createdAt: '2026-09-24T10:00:00Z',
          expiresAt: '2026-10-01T10:00:00Z',
          downloadCount: 0,
          scope: { conversation_ids: ['c1', 'c2'] },
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'e1', state: 'ready', downloadCount: 0, conversationCount: 2 });
  });

  it('parses expiresAt so the UI can warn before an export expires', () => {
    const [row] = parseExports({
      export_requests: [{ id: 'e1', state: 'ready', expiresAt: '2026-10-06T10:00:00Z', scope: { conversation_ids: [] } }],
    });
    expect(row.expiresAt).toBe('2026-10-06T10:00:00Z');
  });

  it('marks a consumed export via downloadCount so the UI can say "downloaded"', () => {
    const [row] = parseExports({
      export_requests: [{ id: 'e2', state: 'ready', downloadCount: 1, scope: { conversation_ids: [] } }],
    });
    expect(row.downloadCount).toBe(1);
  });

  it('nulls a non-numeric downloadCount instead of rendering garbage', () => {
    const [row] = parseExports({ export_requests: [{ id: 'e3', downloadCount: 'many' }] });
    expect(row.downloadCount).toBeNull();
  });

  it('accepts a bare array and survives garbage', () => {
    expect(parseExports([{ id: 'e1', state: 'ready', scope: { conversation_ids: [] } }])).toHaveLength(1);
    expect(parseExports(null)).toEqual([]);
    expect(parseExports({})).toEqual([]);
    expect(parseExports({ export_requests: [{ nope: true }] })).toEqual([]);
  });
});

// ── C-06: holds read the wire placedAt field ───────────────────────────────

describe('parseLegalHolds', () => {
  it('parses the camelCase legal_holds envelope', () => {
    const rows = parseLegalHolds({
      legal_holds: [
        {
          id: 'h1',
          status: 'active',
          scopeType: 'conversation',
          scopeId: 'c1',
          holdReason: 'litigation',
          placedAt: '2026-09-24T10:00:00Z',
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'h1',
      status: 'active',
      scopeType: 'conversation',
      scopeId: 'c1',
      reason: 'litigation',
      placedAt: '2026-09-24T10:00:00Z',
    });
  });

  it('reads placedAt (the wire field), not createdAt', () => {
    const [hold] = parseLegalHolds({
      legal_holds: [
        {
          id: 'h1',
          status: 'active',
          placedAt: '2026-09-20T00:00:00Z',
          createdAt: '2020-01-01T00:00:00Z',
        },
      ],
    });
    expect(hold.placedAt).toBe('2026-09-20T00:00:00Z');
  });

  it('falls back to the legacy createdAt when placedAt is absent (C-06)', () => {
    const [hold] = parseLegalHolds({
      legal_holds: [{ id: 'h1', status: 'active', createdAt: '2026-09-24T10:00:00Z' }],
    });
    expect(hold.placedAt).toBe('2026-09-24T10:00:00Z');
  });

  it('parses scopeId, placedBy, and releasedAt (C-07)', () => {
    const [hold] = parseLegalHolds({
      legal_holds: [
        {
          id: 'h1',
          status: 'released',
          scopeType: 'conversation',
          scopeId: UUID,
          placedBy: 'u-1',
          placedAt: '2026-09-24T10:00:00Z',
          releasedAt: '2026-09-25T10:00:00Z',
          holdReason: 'done',
        },
      ],
    });
    expect(hold.scopeId).toBe(UUID);
    expect(hold.placedBy).toBe('u-1');
    expect(hold.releasedAt).toBe('2026-09-25T10:00:00Z');
    expect(hold.reason).toBe('done');
  });

  it('drops rows without an id and survives garbage', () => {
    expect(parseLegalHolds({ legal_holds: [{ status: 'active' }] })).toEqual([]);
    expect(parseLegalHolds(null)).toEqual([]);
    expect(parseLegalHolds({ legal_holds: [{ nope: true }] })).toEqual([]);
  });
});

// ── C-05: one-time download token from the create envelope ─────────────────

describe('parseExportRequest / parseExportToken (C-05)', () => {
  it('parses the id + one-time download token from the export_request envelope', () => {
    const raw = { export_request: { id: 'e1', download_token: 'abc123' } };
    expect(parseExportRequest(raw)).toEqual({ id: 'e1', downloadToken: 'abc123' });
    expect(parseExportToken(raw)).toBe('abc123');
  });

  it('returns nulls when the token is missing or the row is garbage', () => {
    expect(parseExportRequest({ export_request: { id: 'e1' } })).toEqual({ id: 'e1', downloadToken: null });
    expect(parseExportToken({ export_request: { id: 'e1' } })).toBeNull();
    expect(parseExportRequest(null)).toEqual({ id: null, downloadToken: null });
    expect(parseExportToken(null)).toBeNull();
    expect(parseExportToken({ nope: true })).toBeNull();
  });
});

// ── C-08: purge task + tombstone parsers ────────────────────────────────────

describe('parsePurgeTask (C-08)', () => {
  it('parses the purge_task envelope', () => {
    expect(
      parsePurgeTask({
        purge_task: {
          id: 'p1',
          state: 'running',
          step: 'hold_check',
          scopeType: 'conversation',
          scopeId: UUID,
          reason: 'user_request',
          lastError: null,
          createdAt: '2026-09-24T10:00:00Z',
          finishedAt: null,
        },
      }),
    ).toMatchObject({
      id: 'p1',
      state: 'running',
      step: 'hold_check',
      scopeType: 'conversation',
      scopeId: UUID,
      reason: 'user_request',
    });
  });

  it('returns null when the task has no id', () => {
    expect(parsePurgeTask(null)).toBeNull();
    expect(parsePurgeTask({ purge_task: { nope: true } })).toBeNull();
  });
});

describe('parseTombstone (C-08)', () => {
  it('parses the engine tombstone contract { tombstoned, reason }', () => {
    expect(parseTombstone({ tombstoned: true, reason: 'user_request' })).toEqual({
      tombstoned: true,
      reason: 'user_request',
    });
  });

  it('defaults to not-tombstoned', () => {
    expect(parseTombstone({})).toEqual({ tombstoned: false, reason: null });
    expect(parseTombstone(null)).toEqual({ tombstoned: false, reason: null });
  });
});

// ── C-08: governance builders mirror the engine DTO vocabularies ────────────

describe('engine vocabulary constants', () => {
  it('hold scopes match HoldDto @IsIn (organization, conversation)', () => {
    expect([...HOLD_SCOPE_TYPES]).toEqual(['organization', 'conversation']);
  });

  it('purge scopes/reasons match PurgeDto @IsIn', () => {
    expect([...PURGE_SCOPE_TYPES]).toEqual(['conversation']);
    expect([...PURGE_REASONS]).toEqual(['user_request', 'retention_expiry', 'org_deletion']);
  });
});

describe('buildHoldBody', () => {
  it('builds a conversation hold body', () => {
    expect(buildHoldBody({ scopeType: 'conversation', scopeId: UUID, reason: 'litigation' })).toEqual({
      body: { scope_type: 'conversation', scope_id: UUID, reason: 'litigation' },
    });
  });

  it('omits scope_id for a whole-organization hold', () => {
    const { body, error } = buildHoldBody({ scopeType: 'organization', scopeId: '', reason: 'audit' });
    expect(error).toBeUndefined();
    expect(body).toEqual({ scope_type: 'organization', reason: 'audit' });
  });

  it('rejects unknown scopes, non-UUID scope ids, and missing/oversize reasons', () => {
    expect(buildHoldBody({ scopeType: 'user', scopeId: UUID, reason: 'x' }).error).toMatch(/Scope must be one of/);
    expect(buildHoldBody({ scopeType: 'conversation', scopeId: 'nope', reason: 'x' }).error).toMatch(/UUID/);
    expect(buildHoldBody({ scopeType: 'conversation', scopeId: UUID, reason: '  ' }).error).toMatch(/reason is required/i);
    expect(buildHoldBody({ scopeType: 'conversation', scopeId: UUID, reason: 'r'.repeat(513) }).error).toMatch(/512/);
  });
});

describe('buildPurgeBody', () => {
  it('builds a purge body', () => {
    expect(buildPurgeBody({ scopeType: 'conversation', scopeId: UUID, reason: 'user_request' })).toEqual({
      body: { scope_type: 'conversation', scope_id: UUID, reason: 'user_request' },
    });
  });

  it('rejects wrong scope, non-UUID id, and unknown reason', () => {
    expect(buildPurgeBody({ scopeType: 'organization', scopeId: UUID, reason: 'user_request' }).error).toMatch(
      /Scope must be one of/,
    );
    expect(buildPurgeBody({ scopeType: 'conversation', scopeId: 'bad', reason: 'user_request' }).error).toMatch(/UUID/);
    expect(buildPurgeBody({ scopeType: 'conversation', scopeId: UUID, reason: 'made-up' }).error).toMatch(
      /Reason must be one of/,
    );
  });
});

describe('buildRetentionPolicyBody', () => {
  it('builds a policy body with a numeric keep_days', () => {
    expect(
      buildRetentionPolicyBody({ resourceType: 'conversation', retentionClass: 'standard', keepDays: '365' }),
    ).toEqual({ body: { resource_type: 'conversation', retention_class: 'standard', keep_days: 365 } });
  });

  it('rejects missing fields and non-positive-integer keep days', () => {
    expect(
      buildRetentionPolicyBody({ resourceType: '', retentionClass: 'standard', keepDays: '365' }).error,
    ).toMatch(/Resource type/);
    expect(
      buildRetentionPolicyBody({ resourceType: 'conversation', retentionClass: '', keepDays: '365' }).error,
    ).toMatch(/Retention class/);
    expect(
      buildRetentionPolicyBody({ resourceType: 'conversation', retentionClass: 'standard', keepDays: '0' }).error,
    ).toMatch(/positive integer/);
    expect(
      buildRetentionPolicyBody({ resourceType: 'conversation', retentionClass: 'standard', keepDays: '1.5' }).error,
    ).toMatch(/positive integer/);
    expect(
      buildRetentionPolicyBody({ resourceType: 'conversation', retentionClass: 'standard', keepDays: 'abc' }).error,
    ).toMatch(/positive integer/);
  });
});
