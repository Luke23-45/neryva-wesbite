import { describe, expect, it } from 'vitest';
import { parseApprovals } from './useSetupApprovals';

describe('parseApprovals', () => {
  it('reads queue rows with read-time expiry flags (camelCase and snake_case)', () => {
    const rows = parseApprovals({
      approvals: [
        { id: 'p1', runId: 'r1', approvalRef: 'tool:update_ticket', summary: 'Update TCK-1', actionType: 'tool_call', state: 'PENDING', expiresAt: '2026-12-31T00:00:00Z', expired: false, createdAt: '2026-09-17T00:00:00Z' },
        { id: 'p2', run_id: 'r2', state: 'APPROVED', expired: false },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 'p1', runId: 'r1', approvalRef: 'tool:update_ticket', state: 'PENDING', expired: false });
    expect(rows[1]).toMatchObject({ runId: 'r2', state: 'APPROVED' });
  });

  it('drops rows without ids and tolerates junk', () => {
    expect(parseApprovals({ approvals: [{ state: 'PENDING' }, null] })).toEqual([]);
    expect(parseApprovals(null)).toEqual([]);
  });

  it('A17 — defaults chain fields for single-approver rows', () => {
    const rows = parseApprovals({ approvals: [{ id: 'p1', state: 'PENDING' }] });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ requiredApprovals: 1, approvalsReceived: [] });
  });

  it('A17 — parses multi-approver chain state (camelCase and snake_case)', () => {
    const rows = parseApprovals({
      approvals: [
        {
          id: 'c1',
          state: 'PENDING',
          requiredApprovals: 3,
          approvalsReceived: [
            { actor: 'actor-1', decision: 'APPROVED' },
            { actor: 'actor-2', decision: 'APPROVED' },
          ],
        },
        {
          id: 'c2',
          state: 'PENDING',
          required_approvals: 2,
          approvals_received: [{ actor: 'actor-9', decision: 'APPROVED' }, null, { actor: '', decision: 'APPROVED' }],
        },
        { id: 'c3', state: 'PENDING', requiredApprovals: 0 },
        { id: 'c4', state: 'PENDING', requiredApprovals: 'three' },
      ],
    });
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      requiredApprovals: 3,
      approvalsReceived: [
        { actor: 'actor-1', decision: 'APPROVED' },
        { actor: 'actor-2', decision: 'APPROVED' },
      ],
    });
    // Malformed vote entries are dropped, valid ones survive.
    expect(rows[1]).toMatchObject({
      requiredApprovals: 2,
      approvalsReceived: [{ actor: 'actor-9', decision: 'APPROVED' }],
    });
    // Out-of-range / non-numeric chain sizes fall back to single-approver.
    expect(rows[2]).toMatchObject({ requiredApprovals: 1 });
    expect(rows[3]).toMatchObject({ requiredApprovals: 1 });
  });
});
