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
});
