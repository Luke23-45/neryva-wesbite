import { describe, expect, it } from 'vitest';
import { predictNextVersionNumber } from './OverviewScreen';
import type { AgentVersion } from '@hooks/studio/useAgentAuthoring';

/**
 * Console field audit — B-03: the Overview's "Next" line used to read
 * "Publishes as vN" — a client-side prediction that reads as a promise. The
 * server assigns the real number under an advisory lock at publish time, so
 * under concurrent publishes the prediction can be wrong. The UI now labels
 * it "Expected vN · assigned at publish"; this test pins the prediction math
 * (max(version) WHERE version > 0 over ALL rows, no status filter — the
 * engine's exact rule in pg-assistant-version.repository.ts publishVersion).
 */
function version(n: number, status: string | null): AgentVersion {
  return {
    id: `v${n}`,
    version: n,
    status,
    hash: null,
    createdAt: null,
    publishedAt: null,
    publishedBy: null,
    rollbackOf: null,
    definition: null,
    updatedAt: null,
    parentVersionId: null,
  };
}

describe('predictNextVersionNumber (B-03)', () => {
  it('returns 1 when no row has version > 0', () => {
    expect(predictNextVersionNumber([])).toBe(1);
    expect(predictNextVersionNumber([version(0, 'DRAFT')])).toBe(1);
  });

  it('returns max(version > 0) + 1 over all rows', () => {
    expect(predictNextVersionNumber([version(1, 'PUBLISHED'), version(2, 'PUBLISHED')])).toBe(3);
  });

  it('does not filter by status — the max row wins, like the engine', () => {
    // Wire-possible fixture: v9 was rolled back (a historical status the
    // engine's wire format can still carry), then v10 published after it.
    // The engine computes max(version) WHERE version > 0 with NO status
    // filter, so the prediction must follow the max row, not the max
    // PUBLISHED row.
    const rows = [version(1, 'PUBLISHED'), version(9, 'ROLLED_BACK'), version(10, 'PUBLISHED')];
    expect(predictNextVersionNumber(rows)).toBe(11);
  });

  it('handles gaps in the published sequence', () => {
    const rows = [version(1, 'PUBLISHED'), version(4, 'PUBLISHED')];
    expect(predictNextVersionNumber(rows)).toBe(5);
  });
});
