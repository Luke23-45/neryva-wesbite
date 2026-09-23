import { describe, expect, it } from 'vitest';
import {
  TRY_PROMPT_MAX,
  TRY_PROMPT_MIN,
  describeGuardrailRow,
  describeToolRow,
  describeTryPrereqs,
  describeTryStop,
  extractReportedHits,
  extractReportedVerdicts,
  gradeResponse,
  validateTryPrompt,
} from './try-model';

describe('prompt bounds (service owns 1..8192)', () => {
  it('mirrors the engine bounds', () => {
    expect(TRY_PROMPT_MIN).toBe(1);
    expect(TRY_PROMPT_MAX).toBe(8192);
  });
  it('rejects empty, accepts edges, rejects over-max', () => {
    expect(validateTryPrompt('   ').ok).toBe(false);
    expect(validateTryPrompt('hello')).toEqual({ ok: true });
    expect(validateTryPrompt('x'.repeat(8192))).toEqual({ ok: true });
    expect(validateTryPrompt('x'.repeat(8193))).toMatchObject({ ok: false });
  });
});

describe('describeTryPrereqs (blocks before advisory)', () => {
  it('returns empty when ready', () => {
    expect(describeTryPrereqs({ hasRunnableVersion: true, usableModelCount: 2, hasInstructions: true })).toEqual([]);
  });
  it('orders blocks first, advisory last', () => {
    const prereqs = describeTryPrereqs({ hasRunnableVersion: false, usableModelCount: 0, hasInstructions: false });
    expect(prereqs.map((p) => p.kind)).toEqual(['no-version', 'no-model', 'instructions-advisory']);
    expect(prereqs[0].tone).toBe('block');
    expect(prereqs[2].tone).toBe('advisory');
    expect(prereqs[2].headline).toMatch(/publish refuses/);
  });
});

describe('describeTryStop (separate lines, never merged)', () => {
  it('names the wall-clock dimension on engine FAILED', () => {
    const stop = describeTryStop({ state: 'FAILED', reason: 'budget_exceeded_wall_clock' });
    expect(stop.kind).toBe('wall-clock');
    expect(stop.headline).toMatch(/budget_exceeded_wall_clock/);
  });
  it('renders other failures with the reported reason first (A2-68)', () => {
    const stop = describeTryStop({ state: 'FAILED', reason: 'provider_timeout' });
    expect(stop.kind).toBe('failed');
    expect(stop.headline).toBe('The run failed: provider_timeout.');
  });
  it('names the classified cause on a tool-policy denial', () => {
    const stop = describeTryStop({ state: 'failed', reason: 'tool policy denied: create_ticket' });
    expect(stop.kind).toBe('failed');
    expect(stop.headline).toBe('The run failed: tool policy denied: create_ticket.');
  });
  it('falls back to the state when no reason was reported', () => {
    const stop = describeTryStop({ state: 'FAILED', reason: null });
    expect(stop.kind).toBe('failed');
    expect(stop.headline).toContain('FAILED');
  });
  it('renders cost/usage stops as reported-only', () => {
    const stop = describeTryStop({ state: 'completed', reason: 'budget limit reported by studio' });
    expect(stop.kind).toBe('reported');
    expect(stop.detail).toMatch(/report only/);
  });
  it('stays silent when nothing stopped', () => {
    expect(describeTryStop({ state: 'completed', reason: null }).kind).toBe('none');
  });
});

describe('extractReportedHits (render only what arrived)', () => {
  it('tolerates camel/snake shapes and ignores unknowns', () => {
    expect(extractReportedHits(null)).toEqual([]);
    expect(extractReportedHits({ unrelated: true })).toEqual([]);
    expect(extractReportedHits({ title: 'returns-policy', chunk_id: 'c4', score: 0.87 })).toEqual([
      { title: 'returns-policy', chunk: 'c4', score: 0.87 },
    ]);
    expect(extractReportedHits({ hits: [{ documentId: 'd1', chunkIndex: 4 }] })).toEqual([
      { title: 'd1', chunk: 'chunk 4', score: null },
    ]);
  });
});

describe('gradeResponse (usability only — never gates publish)', () => {
  const NOW = Date.parse('2026-09-18T12:00:00Z');
  it('locks without a runnable version, ghosts until the first try', () => {
    expect(gradeResponse({ hasRunnableVersion: false, lastTryAt: null, lastTryFailed: false, nowMs: NOW }).status).toBe('locked');
    expect(gradeResponse({ hasRunnableVersion: true, lastTryAt: null, lastTryFailed: false, nowMs: NOW })).toMatchObject({
      subtitle: null,
      status: 'untouched',
    });
  });
  it('grades tried/failed honestly with relative time', () => {
    expect(
      gradeResponse({ hasRunnableVersion: true, lastTryAt: '2026-09-18T11:59:30Z', lastTryFailed: false, nowMs: NOW }).subtitle,
    ).toBe('Tried just now');
    expect(
      gradeResponse({ hasRunnableVersion: true, lastTryAt: '2026-09-18T11:30:00Z', lastTryFailed: false, nowMs: NOW }).subtitle,
    ).toBe('Tried 30m ago');
    expect(
      gradeResponse({ hasRunnableVersion: true, lastTryAt: '2026-09-18T11:59:30Z', lastTryFailed: true, nowMs: NOW }).status,
    ).toBe('attention');
  });
});

describe('row descriptors (honest verdicts)', () => {
  it('extracts only shaped verdicts, never synthesized ones', () => {
    expect(extractReportedVerdicts(null)).toEqual([]);
    expect(extractReportedVerdicts({ unrelated: true })).toEqual([]);
    expect(extractReportedVerdicts({ policy: 'brand-safe', verdict: 'pass' })).toEqual([{ policy: 'brand-safe', verdict: 'pass' }]);
    expect(extractReportedVerdicts({ guardrails: [{ guardrail: 'pii-redact', decision: 'flagged' }] })).toEqual([
      { policy: 'pii-redact', verdict: 'flagged' },
    ]);
  });
  it('suffixes logging verdicts so they never read as blocks', () => {
    expect(describeGuardrailRow({ policy: 'pii-redact', mode: 'logging', verdict: 'flagged' })).toMatch(/Logged, not blocked/);
    expect(describeGuardrailRow({ policy: 'brand-safe', mode: 'blocking', verdict: 'pass' })).not.toMatch(/Logged/);
  });
  it('renders shadow as simulated, never gating', () => {
    expect(describeToolRow({ tool: 'lookup_order', approval: 'approved', effect: 'read', result: 'ok' })).toBe(
      'lookup_order · approved · read · ok',
    );
    expect(describeToolRow({ tool: 'refund', approval: null, effect: null, result: 'shadow' })).toMatch(/simulated, gated nothing/);
  });
});
