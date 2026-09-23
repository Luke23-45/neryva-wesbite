/**
 * C14 publish-model tests — ranges green first (protocol Step 4.1).
 * Every refusal string mirrors the engine verbatim (see publish-model.ts).
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '@lib/engine/client';
import { defaultConsumer } from '@lib/engine/agent-payload';
import {
  PUBLISHABLE_STATUSES,
  classifyPublishRefusal,
  derivePublishReadiness,
  detectNoChangeHint,
  evaluateRequiredGate,
  gradeShip,
  isPublishableStatus,
  readinessVerdict,
  refusalFix,
  type ReadinessInputs,
} from './publish-model';

function apiError(status: number, message: string, details?: unknown): ApiError {
  return new ApiError(status, 'conflict', message, details);
}

describe('isPublishableStatus', () => {
  it('admits DRAFT/VALID/VALIDATING only (service.ts:708)', () => {
    expect(PUBLISHABLE_STATUSES).toEqual(['DRAFT', 'VALID', 'VALIDATING']);
    expect(isPublishableStatus('DRAFT')).toBe(true);
    expect(isPublishableStatus('PUBLISHED')).toBe(false);
    expect(isPublishableStatus('RETIRED')).toBe(false);
    expect(isPublishableStatus(null)).toBe(false);
  });
});

describe('classifyPublishRefusal', () => {
  it('matches the joint no-op before the legacy prefix (legacy is a prefix of joint)', () => {
    expect(
      classifyPublishRefusal(apiError(409, 'assistant active version already carries this payload and resolved set', { assistant_id: 'a' })),
    ).toBe('no-op');
    expect(
      classifyPublishRefusal(apiError(409, 'assistant active version already carries this payload', { assistant_id: 'a' })),
    ).toBe('no-op');
  });

  it('matches BLOCK and required-checks verbatim', () => {
    expect(
      classifyPublishRefusal(apiError(409, 'the latest evaluation of this content decided BLOCK — resolve the critical failures and re-evaluate before publishing')),
    ).toBe('blocked-content');
    expect(
      classifyPublishRefusal(
        apiError(409, 'release policy requires a fresh PASS evaluation (checks: safety); the latest decision for this content is absent — evaluate this version, then publish', {
          required_checks: ['safety'],
          latest_decision: null,
        }),
      ),
    ).toBe('required-checks');
  });

  it('matches the FAIL refusal verbatim (A2-80)', () => {
    expect(
      classifyPublishRefusal(apiError(409, 'the latest evaluation of this content decided FAIL — fix the failing cases and re-evaluate before publishing')),
    ).toBe('failed-content');
  });
});

  it('disambiguates the 400s by details key', () => {
    expect(classifyPublishRefusal(apiError(400, 'Request validation failed', { knowledge_pins: 'unresolved knowledge sources cannot publish: x' }))).toBe('degraded');
    expect(classifyPublishRefusal(apiError(400, 'Request validation failed', { tool_policy: 'tool pins rejected: t' }))).toBe('tools');
    expect(classifyPublishRefusal(apiError(400, 'Request validation failed', { model_policy: 'allowed_models not present' }))).toBe('models');
    expect(classifyPublishRefusal(apiError(400, 'Request validation failed', { residency: "residency 'eu' not served" }))).toBe('models');
    expect(classifyPublishRefusal(apiError(400, 'Request validation failed', { instructions: 'schema v2 assistants require non-empty instructions' }))).toBe(
      'instructions',
    );
    expect(classifyPublishRefusal(apiError(400, 'Request validation failed', { status: 'version status PUBLISHED cannot be published' }))).toBe('status');
  });

  it('falls back to payload for keyless 400s and unknown otherwise', () => {
    expect(classifyPublishRefusal(apiError(400, 'Request validation failed', { assistant: ['bad shape'] }))).toBe('payload');
    expect(classifyPublishRefusal(apiError(409, 'some future gate refused'))).toBe('unknown');
    expect(classifyPublishRefusal(new Error('boom'))).toBe('unknown');
    expect(classifyPublishRefusal(null)).toBe('unknown');
  });

  it('every kind has a fix with a label (no dead branches)', () => {
    const kinds = ['no-op', 'blocked-content', 'failed-content', 'required-checks', 'degraded', 'status', 'payload', 'models', 'tools', 'instructions', 'unknown'] as const;
    for (const kind of kinds) {
      const fix = refusalFix(kind);
      expect(fix.title.length).toBeGreaterThan(0);
      expect(fix.fixLabel.length).toBeGreaterThan(0);
    }
  });

describe('evaluateRequiredGate', () => {
  it('passes only on fresh PASS with declared checks', () => {
    expect(evaluateRequiredGate({ required: ['safety'], decision: 'PASS', freshness: 'fresh', finishedAt: '2026-09-18T14:02' }).state).toBe('pass');
  });

  it('fails on WARN/BLOCK/absent and on stale or unknown freshness', () => {
    expect(evaluateRequiredGate({ required: ['safety'], decision: 'WARN', freshness: 'fresh', finishedAt: null }).state).toBe('fail');
    expect(evaluateRequiredGate({ required: ['safety'], decision: 'BLOCK', freshness: 'fresh', finishedAt: null }).state).toBe('fail');
    expect(evaluateRequiredGate({ required: ['safety'], decision: null, freshness: 'unknown', finishedAt: null }).state).toBe('fail');
    expect(evaluateRequiredGate({ required: ['safety'], decision: 'PASS', freshness: 'stale', finishedAt: '2026-09-18T14:02' }).state).toBe('fail');
    expect(evaluateRequiredGate({ required: ['safety'], decision: 'PASS', freshness: 'unknown', finishedAt: null }).state).toBe('fail');
  });

  it('reports not-declared with zero checks and renders objects in plain words', () => {
    const empty = evaluateRequiredGate({ required: [], decision: null, freshness: 'unknown', finishedAt: null });
    expect(empty.state).toBe('not-declared');
    const mixed = evaluateRequiredGate({
      required: ['safety', { regression_no_worse_than: 0.02 }],
      decision: null,
      freshness: 'unknown',
      finishedAt: null,
    });
    expect(mixed.checks[1].label).toBe('regression bound');
    expect(mixed.headline).toContain('safety');
    expect(mixed.headline).not.toContain('[object Object]');
  });
});

describe('detectNoChangeHint', () => {
  const draft = { instructions: 'Help.', model_policy: { allowed_models: ['acme/large'], fallback_enabled: false }, tools: [{ name: 'web_search' }] };

  it('is key-order insensitive and advisory-only in spirit (false without an active version)', () => {
    const reordered = { tools: [{ name: 'web_search' }], model_policy: { fallback_enabled: false, allowed_models: ['acme/large'] }, instructions: 'Help.' };
    expect(detectNoChangeHint(draft, reordered)).toBe(true);
    expect(detectNoChangeHint(draft, null)).toBe(false);
    expect(detectNoChangeHint(draft, { ...draft, instructions: 'Help more.' })).toBe(false);
  });
});

describe('readinessVerdict', () => {
  it('computes go / conditional-go / no-go / unknown without percentages', () => {
    expect(readinessVerdict([{ ok: true, ackable: false, acked: false }])).toBe('go');
    expect(readinessVerdict([])).toBe('unknown');
    expect(readinessVerdict([{ ok: null, ackable: false, acked: false }])).toBe('unknown');
    expect(
      readinessVerdict([
        { ok: true, ackable: false, acked: false },
        { ok: false, ackable: true, acked: true },
      ]),
    ).toBe('conditional-go');
    expect(
      readinessVerdict([
        { ok: false, ackable: true, acked: true },
        { ok: false, ackable: false, acked: false },
      ]),
    ).toBe('no-go');
  });
});

describe('gradeShip', () => {
  it('grades the spine from readiness without inventing states', () => {
    expect(gradeShip({ locked: true, readiness: null }).status).toBe('locked');
    expect(gradeShip({ locked: false, readiness: null }).status).toBe('info');
    expect(gradeShip({ locked: false, readiness: { verdict: 'go', blockers: 0, checking: false } }).status).toBe('ready');
    expect(gradeShip({ locked: false, readiness: { verdict: 'conditional-go', blockers: 0, checking: false } }).status).toBe('info');
    const noGo = gradeShip({ locked: false, readiness: { verdict: 'no-go', blockers: 2, checking: false } });
    expect(noGo.status).toBe('attention');
    expect(noGo.subtitle).toContain('2 blockers');
    expect(gradeShip({ locked: false, readiness: { verdict: 'unknown', blockers: 0, checking: false } }).status).toBe('untouched');
  });
});

function draftDefinition() {
  const base = defaultConsumer();
  return {
    ...base,
    instructions: 'Help users with returns.',
    model_policy: { allowed_models: ['acme/large'], fallback_enabled: false },
    context_policy: { ...base.context_policy, knowledge_sources: ['returns-2024'] },
    tools: [],
  };
}

function draftVersion(updatedAt = '2026-09-18T12:00') {
  return { id: 'v7', version: 7, status: 'DRAFT', hash: 'a41f', updatedAt, definition: draftDefinition() };
}

function passRun(): { assistantVersionId: string; state: string; decision: string; isShadow: boolean; startedAt: string; finishedAt: string } {
  return { assistantVersionId: 'v7', state: 'completed', decision: 'PASS', isShadow: false, startedAt: '2026-09-18T14:00', finishedAt: '2026-09-18T14:02' };
}

function readinessInput(overrides: Partial<ReadinessInputs> = {}): ReadinessInputs {
  return {
    version: draftVersion(),
    versionsLoaded: true,
    activeDefinition: draftDefinition(),
    templateRequired: ['safety'],
    templateLoaded: true,
    models: [{ ref: 'acme/large', usable: true }],
    catalog: [],
    toolBuiltins: ['web_search', 'request_human_handoff', 'generate_image', 'search_knowledge', 'search_memory'],
    healthPins: [{ sourceSlug: 'returns-2024', resolved: true, state: 'ready', embeddingComplete: true }],
    libraryStates: { 'returns-2024': 'ready' },
    documentsLoaded: true,
    evalRuns: [],
    acknowledged: false,
    ...overrides,
  };
}

describe('derivePublishReadiness (single derivation)', () => {
  it('fails required-but-absent while everything else passes', () => {
    const derived = derivePublishReadiness(readinessInput());
    expect(derived.rows).toHaveLength(6);
    expect(derived.rows.find((r) => r.id === 'required')?.ok).toBe(false);
    expect(derived.rows.find((r) => r.id === 'block')?.ok).toBe(true);
    expect(derived.rows.find((r) => r.id === 'knowledge')?.ok).toBe(true);
    expect(derived.verdict).toBe('no-go');
    expect(derived.publishable).toBe(false);
  });

  it('goes green on a fresh PASS covering the draft', () => {
    const derived = derivePublishReadiness(
      readinessInput({
        version: draftVersion('2026-09-18T13:00'),
        evalRuns: [passRun()],
      }),
    );
    expect(derived.rows.find((r) => r.id === 'required')?.ok).toBe(true);
    expect(derived.verdict).toBe('go');
    expect(derived.publishable).toBe(true);
  });

  it('fails BLOCK and stale PASS with a re-run fix', () => {
    const derived = derivePublishReadiness(
      readinessInput({
        evalRuns: [{ ...passRun(), decision: 'BLOCK' }],
      }),
    );
    expect(derived.rows.find((r) => r.id === 'block')?.ok).toBe(false);
    expect(derived.rows.find((r) => r.id === 'required')?.ok).toBe(false);
    expect(derived.verdict).toBe('no-go');
  });

  it('fails FAIL on the block row with failing-case copy (A2-80)', () => {
    const derived = derivePublishReadiness(
      readinessInput({
        evalRuns: [{ ...passRun(), decision: 'FAIL' }],
      }),
    );
    const blockRow = derived.rows.find((r) => r.id === 'block');
    expect(blockRow?.ok).toBe(false);
    expect(blockRow?.detail).toMatch(/decided FAIL/);
    expect(blockRow?.detail).toMatch(/failing cases/);
    expect(derived.rows.find((r) => r.id === 'required')?.ok).toBe(false);
    expect(derived.verdict).toBe('no-go');
    expect(derived.publishable).toBe(false);
  });

  it('ignores shadow decisions for both gates', () => {
    const derived = derivePublishReadiness(
      readinessInput({
        evalRuns: [{ ...passRun(), decision: 'BLOCK', isShadow: true }],
      }),
    );
    expect(derived.rows.find((r) => r.id === 'block')?.ok).toBe(true);
    expect(derived.decision).toBeNull();
  });

  it('arms the degraded ack without blocking the ceremony', () => {
    const degraded = readinessInput({
      version: draftVersion('2026-09-18T13:00'),
      templateRequired: [],
      evalRuns: [passRun()],
      healthPins: [{ sourceSlug: 'returns-2024', resolved: false, state: null, embeddingComplete: null }],
    });
    const unacked = derivePublishReadiness(degraded);
    expect(unacked.needsAcknowledge).toBe(true);
    expect(unacked.unresolvedSlugs).toEqual(['returns-2024']);
    expect(unacked.verdict).toBe('no-go');
    const acked = derivePublishReadiness({ ...degraded, acknowledged: true });
    expect(acked.verdict).toBe('conditional-go');
    expect(acked.publishable).toBe(true);
  });

  it('renders object checks in plain words, never joined mixes', () => {
    const derived = derivePublishReadiness(
      readinessInput({ templateRequired: ['safety', { regression_no_worse_than: 0.02 }] }),
    );
    const row = derived.rows.find((r) => r.id === 'required');
    expect(row?.detail).toContain('safety');
    expect(row?.detail).not.toContain('[object Object]');
    expect(row?.extra?.join(' ')).toContain('regression bound');
  });

  it('stays neutral while reads land, never red', () => {
    const derived = derivePublishReadiness(
      readinessInput({ models: undefined, catalog: undefined, healthPins: undefined, documentsLoaded: false, evalRuns: undefined, templateLoaded: false }),
    );
    expect(derived.rows.filter((r) => r.ok === null)).toHaveLength(5);
    expect(derived.rows.find((r) => r.id === 'shape')?.ok).toBe(true);
    expect(derived.verdict).toBe('unknown');
  });

  it('names a missing version instead of ghosting', () => {
    const gone = derivePublishReadiness(readinessInput({ version: null, versionsLoaded: true }));
    expect(gone.rows).toHaveLength(1);
    expect(gone.rows[0].ok).toBe(false);
    const loading = derivePublishReadiness(readinessInput({ version: null, versionsLoaded: false }));
    expect(loading.rows).toHaveLength(0);
  });
});
