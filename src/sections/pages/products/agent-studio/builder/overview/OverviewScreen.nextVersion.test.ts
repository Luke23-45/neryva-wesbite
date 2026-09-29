import { describe, expect, it } from 'vitest';
import { predictNextVersionNumber } from './OverviewScreen';
import type { AgentVersion } from '@hooks/studio/useAgentAuthoring';

/**
 * Console field audit — B-03: the Overview's "Next" line used to read
 * "Publishes as vN" — a client-side prediction that reads as a promise. The
 * server assigns the real number under an advisory lock at publish time, so
 * under concurrent publishes the prediction can be wrong. The UI now labels
 * it "Expected vN · assigned at publish"; this test pins the prediction math
 * (max published + 1, or 1 when nothing is published).
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
  it('returns 1 when nothing is published yet', () => {
    expect(predictNextVersionNumber([])).toBe(1);
    expect(predictNextVersionNumber([version(0, 'DRAFT')])).toBe(1);
  });

  it('returns max(published) + 1', () => {
    expect(predictNextVersionNumber([version(1, 'PUBLISHED'), version(2, 'PUBLISHED')])).toBe(3);
  });

  it('ignores non-published rows (drafts, rolled-back)', () => {
    const rows = [version(1, 'PUBLISHED'), version(5, 'DRAFT'), version(9, 'ROLLED_BACK')];
    expect(predictNextVersionNumber(rows)).toBe(2);
  });

  it('handles gaps in the published sequence', () => {
    const rows = [version(1, 'PUBLISHED'), version(4, 'PUBLISHED')];
    expect(predictNextVersionNumber(rows)).toBe(5);
  });
});
