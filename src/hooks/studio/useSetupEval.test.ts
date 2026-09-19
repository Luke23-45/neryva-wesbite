import { describe, expect, it } from 'vitest';
import { parseDatasets, parseEvalResults, parseEvalRuns } from './useSetupEval';

describe('parseDatasets', () => {
  it('reads datasets', () => {
    const rows = parseDatasets({ datasets: [{ id: 'd1', name: 'template:support-concierge@1.0.0', description: null }] });
    expect(rows).toEqual([{ id: 'd1', name: 'template:support-concierge@1.0.0', description: null, createdAt: null }]);
  });

  it('drops rows without ids', () => {
    expect(parseDatasets({ datasets: [{ name: 'x' }] })).toEqual([]);
  });
});

describe('parseEvalRuns', () => {
  it('reads runs with decisions + provenance (camelCase and snake_case)', () => {
    const rows = parseEvalRuns({
      runs: [
        {
          id: 'r1',
          dataset_id: 'd1',
          assistant_version_id: 'v1',
          state: 'completed',
          decision: 'WARN',
          score: 0.91,
          finished_at: '2026-09-16T10:00:00Z',
          provenance: { definition_hash: 'h'.repeat(64), seed: 44 },
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'r1', datasetId: 'd1', state: 'completed', decision: 'WARN', score: '0.91' });
    expect(rows[0].provenance).toMatchObject({ seed: 44 });
  });

  it('tolerates undecided runs and junk', () => {
    const rows = parseEvalRuns({ runs: [{ id: 'r2', state: 'running' }] });
    expect(rows[0]).toMatchObject({ decision: null, score: null, provenance: null });
    expect(parseEvalRuns({ runs: [{ state: 'completed' }] })).toEqual([]);
  });

  it('reads shadow flags, results, and environment (C10 extends, same rows)', () => {
    const rows = parseEvalRuns({
      runs: [
        {
          id: 'r3',
          state: 'completed',
          decision: 'PASS',
          is_shadow: true,
          environment: 'staging',
          results: { cases: [], checks: [{ name: 'refund_policy_cited', passed: true }] },
        },
      ],
    });
    expect(rows[0]).toMatchObject({ isShadow: true, environment: 'staging' });
    expect(rows[0].results).toMatchObject({ checks: [{ name: 'refund_policy_cited', passed: true }] });
    const plain = parseEvalRuns({ runs: [{ id: 'r4', state: 'completed' }] });
    expect(plain[0]).toMatchObject({ isShadow: false, results: null, environment: null });
  });
});

describe('parseEvalResults (worker report — ids + reasons, never inputs)', () => {
  it('reads cases, checks, criticals, and metrics tolerantly', () => {
    const view = parseEvalResults({
      cases: [
        { case_id: 'case_014', attempt: 1, passed: false, score: 0.42, failure_reason: 'missing contain "30 days"', response_excerpt: 'We process returns whenever…' },
        { case_id: 'case_015', attempt: 1, passed: true, score: 1 },
        { junk: true },
      ],
      checks: [{ name: 'refund_policy_cited', passed: true }, { name: 'tone_calm', passed: false }, {}],
      critical_failures: ['unsafe_refund'],
      metrics: { task_success: 0.88, groundedness: null },
    });
    expect(view.cases).toHaveLength(2);
    expect(view.cases[0]).toMatchObject({ caseId: 'case_014', passed: false, failureReason: 'missing contain "30 days"' });
    expect(view.checks).toEqual([
      { name: 'refund_policy_cited', passed: true },
      { name: 'tone_calm', passed: false },
    ]);
    expect(view.criticalFailures).toEqual(['unsafe_refund']);
    expect(view.metrics).toEqual({ task_success: 0.88 });
  });

  it('returns empty views for junk', () => {
    expect(parseEvalResults(null)).toEqual({ cases: [], checks: [], criticalFailures: [], metrics: {} });
    expect(parseEvalResults({ cases: [{ junk: true }] }).cases).toEqual([]);
  });
});
