import { describe, expect, it } from 'vitest';
import { parseExports, parseLegalHolds } from './useLifecycle';

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

  it('accepts a bare array and survives garbage', () => {
    expect(parseExports([{ id: 'e1', state: 'ready', scope: { conversation_ids: [] } }])).toHaveLength(1);
    expect(parseExports(null)).toEqual([]);
    expect(parseExports({})).toEqual([]);
    expect(parseExports({ export_requests: [{ nope: true }] })).toEqual([]);
  });
});

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
          createdAt: '2026-09-24T10:00:00Z',
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
    });
  });

  it('survives garbage', () => {
    expect(parseLegalHolds(null)).toEqual([]);
    expect(parseLegalHolds({ legal_holds: [{ nope: true }] })).toEqual([]);
  });
});
