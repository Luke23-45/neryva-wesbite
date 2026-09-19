import { describe, expect, it } from 'vitest';
import { ApiError } from '@lib/engine/client';
import {
  EVAL_ATTEMPTS_MAX,
  EVAL_ATTEMPTS_MIN,
  clampEvalAttempts,
  describeDatasetOrigin,
  describeDecision,
  describeRequiredCheck,
  describeStaleBanner,
  evalFreshness,
  gradeEvaluation,
  isNoDatasetError,
  selectVersionEvalState,
} from './eval-model';

describe('attempts bounds (engine clamp 1..5)', () => {
  it('mirrors the engine clamp', () => {
    expect(EVAL_ATTEMPTS_MIN).toBe(1);
    expect(EVAL_ATTEMPTS_MAX).toBe(5);
    expect(clampEvalAttempts(0)).toBe(1);
    expect(clampEvalAttempts(3)).toBe(3);
    expect(clampEvalAttempts(9)).toBe(5);
    expect(clampEvalAttempts(Number.NaN)).toBe(1);
  });
});

describe('describeDecision (severity by reversibility)', () => {
  it('frames BLOCK as unshippable and WARN as investigable', () => {
    expect(describeDecision('BLOCK')).toMatchObject({ tone: 'error' });
    expect(describeDecision('BLOCK').detail).toMatch(/cannot publish or promote/);
    expect(describeDecision('WARN').detail).toMatch(/required checks/);
    expect(describeDecision('PASS').detail).toMatch(/later PASS clears/);
  });
});

describe('evalFreshness (gate-honest timestamps, never hash guesses)', () => {
  it('treats PUBLISHED rows as forever fresh', () => {
    expect(evalFreshness({ versionStatus: 'PUBLISHED', versionUpdatedAt: '2026-09-18T12:00:00Z', runFinishedAt: '2026-09-01T00:00:00Z' })).toBe('fresh');
  });
  it('compares draft edits against run finish', () => {
    expect(
      evalFreshness({ versionStatus: 'DRAFT', versionUpdatedAt: '2026-09-18T10:00:00Z', runFinishedAt: '2026-09-18T12:00:00Z' }),
    ).toBe('fresh');
    expect(
      evalFreshness({ versionStatus: 'DRAFT', versionUpdatedAt: '2026-09-18T13:00:00Z', runFinishedAt: '2026-09-18T12:00:00Z' }),
    ).toBe('stale');
  });
  it('refuses to prove freshness from missing timestamps', () => {
    expect(evalFreshness({ versionStatus: 'DRAFT', versionUpdatedAt: null, runFinishedAt: '2026-09-18T12:00:00Z' })).toBe('unknown');
    expect(evalFreshness({ versionStatus: 'RETIRED', versionUpdatedAt: '2026-09-18T12:00:00Z', runFinishedAt: '2026-09-18T12:00:00Z' })).toBe('unknown');
  });
  it('describes the stale banner with times, never invented hashes', () => {
    const banner = describeStaleBanner({ decision: 'PASS', finishedAt: '2026-09-18T12:00:00Z', updatedAt: '2026-09-18T13:00:00Z' });
    expect(banner.headline).toMatch(/Stale decision/);
    expect(banner.detail).toContain('PASS');
    expect(banner.detail).toMatch(/re-run/);
  });
});

describe('describeRequiredCheck (never the engine join on mixed arrays)', () => {
  it('renders strings verbatim and bounds in plain words', () => {
    expect(describeRequiredCheck('refund_policy_cited')).toEqual({ label: 'refund_policy_cited', detail: null });
    const bound = describeRequiredCheck({ regression_no_worse_than: 0.02 });
    expect(bound.label).toBe('regression bound');
    expect(bound.detail).toMatch(/0\.02/);
    expect(bound.detail).toMatch(/previous published/);
  });
  it('falls back to JSON for unknown shapes', () => {
    expect(describeRequiredCheck({ custom_gate: true }).detail).toBe(JSON.stringify({ custom_gate: true }));
  });
});

describe('describeDatasetOrigin (single source)', () => {
  it('classifies seeded vs custom exactly like the library', () => {
    expect(describeDatasetOrigin('template:support-concierge@3')).toBe('Seeded by support-concierge@3');
    expect(describeDatasetOrigin('refund-regressions')).toBe('Custom');
    expect(describeDatasetOrigin('template:broken')).toBe('Custom');
  });
});

describe('gradeEvaluation (signal, never a gate)', () => {
  const base = { hasRunnableVersion: true, running: false, latest: null, hasShadowRuns: false, lastFailed: false, hasRuns: false } as const;
  it('locks without a runnable version, ghosts without runs', () => {
    expect(gradeEvaluation({ ...base, hasRunnableVersion: false }).status).toBe('locked');
    expect(gradeEvaluation(base).status).toBe('untouched');
  });
  it('ranks running above stale, stale above verdicts', () => {
    const stale = { decision: 'PASS' as const, stale: true, shadow: false };
    expect(gradeEvaluation({ ...base, running: true, latest: stale }).status).toBe('info');
    expect(gradeEvaluation({ ...base, latest: stale }).status).toBe('attention');
    expect(gradeEvaluation({ ...base, latest: { ...stale, stale: false } }).status).toBe('ready');
    expect(
      gradeEvaluation({ ...base, latest: { decision: 'BLOCK', stale: false, shadow: false } }).status,
    ).toBe('attention');
    expect(
      gradeEvaluation({ ...base, latest: { decision: 'PASS', stale: false, shadow: true } }).status,
    ).toBe('info');
  });
  it('renders failed, shadow-only, and undecided histories honestly', () => {
    expect(gradeEvaluation({ ...base, lastFailed: true }).status).toBe('attention');
    expect(gradeEvaluation({ ...base, lastFailed: true }).subtitle).toMatch(/failed/);
    expect(gradeEvaluation({ ...base, hasShadowRuns: true }).status).toBe('info');
    expect(gradeEvaluation({ ...base, hasRuns: true }).subtitle).toMatch(/no decision yet/);
  });
});

describe('selectVersionEvalState (single derivation)', () => {
  const draft = { id: 'v3', status: 'DRAFT', updatedAt: '2026-09-18T10:30:00Z' };
  const run = (overrides: Partial<{ assistantVersionId: string | null; state: string; decision: string | null; isShadow: boolean; startedAt: string | null; finishedAt: string | null }>) => ({
    assistantVersionId: 'v3',
    state: 'completed',
    decision: 'PASS',
    isShadow: false,
    startedAt: '2026-09-18T10:00:00Z',
    finishedAt: '2026-09-18T11:00:00Z',
    ...overrides,
  });
  it('returns undefined without a version and scopes runs to the row', () => {
    expect(selectVersionEvalState([run({})], null)).toBeUndefined();
    expect(selectVersionEvalState([run({ assistantVersionId: 'v9' })], draft)).toMatchObject({ hasRuns: false, latest: null });
  });
  it('marks fresh PASS and stale-flags draft edits', () => {
    const fresh = selectVersionEvalState([run({})], draft);
    expect(fresh?.latest).toMatchObject({ decision: 'PASS', stale: false, shadow: false });
    const stale = selectVersionEvalState([run({})], { ...draft, updatedAt: '2026-09-18T13:00:00Z' });
    expect(stale?.latest).toMatchObject({ decision: 'PASS', stale: true });
  });
  it('prefers formal verdicts over shadows and flags running', () => {
    const state = selectVersionEvalState(
      [run({ isShadow: true, finishedAt: '2026-09-18T11:30:00Z' }), run({ decision: 'WARN' }), { ...run({}), state: 'running', decision: null, finishedAt: null }],
      draft,
    );
    expect(state?.running).toBe(true);
    expect(state?.latest).toMatchObject({ decision: 'WARN', shadow: false });
    expect(state?.hasShadowRuns).toBe(true);
  });
  it('falls back to decided shadows, then failed, then nothing', () => {
    const shadowOnly = selectVersionEvalState([run({ isShadow: true })], draft);
    expect(shadowOnly?.latest).toMatchObject({ shadow: true });
    const failed = selectVersionEvalState([{ ...run({}), state: 'failed', decision: null, finishedAt: null }], draft);
    expect(failed).toMatchObject({ latest: null, lastFailed: true, hasRuns: false });
  });
});

describe('isNoDatasetError (400 + dataset_id key, never the code in copy)', () => {
  it('matches only the no-dataset shape', () => {
    const match = new ApiError(400, 'validation_failed', 'Request validation failed', {
      dataset_id: 'no template dataset for this assistant — install from a template or pass dataset_id explicitly',
    });
    expect(isNoDatasetError(match)).toBe(true);
    expect(isNoDatasetError(new ApiError(400, 'validation_failed', 'Request validation failed', { text: 'is required' }))).toBe(false);
    expect(isNoDatasetError(new ApiError(409, 'conflict', 'blocked'))).toBe(false);
    expect(isNoDatasetError(new Error('boom'))).toBe(false);
  });
});
