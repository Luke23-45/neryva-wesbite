/**
 * C10 pure model — eval bounds, copy, and descriptors.
 *
 * Engine binds (verified 2026-09-18, PLAN.md §1):
 * - decision BLOCK > WARN > PASS (`eval.service.ts:798`); gate order
 *   no-op → blocked → required → degraded; refusals 409 verbatim.
 * - gate keys the CONTENT hash, latest completed non-shadow wins
 *   (`release-gate.ts:100-117`); shadow never gates publish (`:109-111`).
 * - no-dataset refusal is 400, not 422 (`ApiError.validation` = 400).
 * - attempts clamped 1..5 (`eval.service.ts:383`); datasets name ≤128,
 *   description ≤2048, unique per org (`eval.schema.ts:19-32`).
 * - version rows are immutable except DRAFT edits (hash + updatedAt move
 *   together) — publish inserts new rows, never mutates. Staleness is a
 *   timestamp compare, never a hash guess (PLAN.md §8 D10).
 */
import { ApiError } from '@lib/engine/client';

/** Attempts bounds — mirrors the engine clamp (`eval.service.ts:383`). */
export const EVAL_ATTEMPTS_MIN = 1;
export const EVAL_ATTEMPTS_MAX = 5;

export function clampEvalAttempts(value: number): number {
  if (!Number.isFinite(value)) return EVAL_ATTEMPTS_MIN;
  return Math.min(Math.max(EVAL_ATTEMPTS_MIN, Math.round(value)), EVAL_ATTEMPTS_MAX);
}

export type EvalDecision = 'PASS' | 'WARN' | 'BLOCK';

/** Copy constants — every string traces to a bind or a PLAN decision. */
export const EVAL_COPY = {
  /** Shadow badge wording is SPEC-mandated, verbatim. */
  shadowBadge: 'shadow — never gates',
  latestWins: 'Latest wins — a later PASS clears any earlier verdict.',
  staleHeadline: 'Stale decision — re-run',
  unknownFreshness: 'Cannot prove this verdict is fresh — re-run to be sure.',
  noDatasetHeadline: 'No dataset to evaluate against.',
  noDatasetDetail:
    'This assistant has no template-seeded dataset. Install from a template, create a dataset, or pick one explicitly.',
  noCaseList: 'Case inputs aren’t listable — cases are add-only.',
  driftSteady: 'No drift signal — the hourly watch pages owners and admins on change.',
  dedupNote: 'A shadow eval already covers the last 24h — steady observation, no new run.',
  publishLink: 'Open publish gates ›',
  evaluationsLink: 'Open Evaluations ›',
  datasetsLink: 'Open Datasets ›',
  reRunSame: 'Re-run with same dataset',
  addCoveringCase: 'Add a covering case',
  attemptsLabel: 'Attempts per case (1–5)',
} as const;

export function describeDecision(decision: EvalDecision): { tone: 'success' | 'warning' | 'error'; headline: string; detail: string } {
  switch (decision) {
    case 'BLOCK':
      return {
        tone: 'error',
        headline: 'BLOCKed — resolve and re-evaluate.',
        detail: 'BLOCKed content cannot publish or promote. Resolve the critical failures and re-evaluate.',
      };
    case 'WARN':
      return {
        tone: 'warning',
        headline: 'WARN — below bar but shippable.',
        detail: 'Below bar but shippable unless the template declares required checks — re-evaluate after fixes.',
      };
    case 'PASS':
      return {
        tone: 'success',
        headline: 'PASS — shippable.',
        detail: 'A later PASS clears any earlier verdict — latest wins for every gate.',
      };
  }
}

export type Freshness = 'fresh' | 'stale' | 'unknown';

/**
 * Gate-honest staleness (PLAN.md §8 D10). Version rows are immutable
 * except DRAFT edits, which move hash + updatedAt together — so for a
 * DRAFT row the run is fresh iff nothing touched the row since it
 * finished. PUBLISHED rows never go stale. Missing timestamps can prove
 * nothing → unknown, never fresh.
 */
export function evalFreshness(input: {
  versionStatus: string | null;
  versionUpdatedAt: string | null;
  runFinishedAt: string | null;
}): Freshness {
  if (input.versionStatus === 'PUBLISHED') {
    return 'fresh';
  }
  if (input.versionStatus !== 'DRAFT') {
    return 'unknown';
  }
  const updated = input.versionUpdatedAt !== null ? Date.parse(input.versionUpdatedAt) : NaN;
  const finished = input.runFinishedAt !== null ? Date.parse(input.runFinishedAt) : NaN;
  if (!Number.isFinite(updated) || !Number.isFinite(finished)) {
    return 'unknown';
  }
  return updated <= finished ? 'fresh' : 'stale';
}

export function describeStaleBanner(input: { decision: EvalDecision; finishedAt: string | null; updatedAt: string | null }): {
  headline: string;
  detail: string;
} {
  const short = (iso: string | null): string => {
    if (!iso) return 'unknown time';
    return iso.slice(0, 16).replace('T', ' ');
  };
  return {
    headline: EVAL_COPY.staleHeadline,
    detail: `${input.decision} · ran ${short(input.finishedAt)} · draft edited ${short(input.updatedAt)} → re-run to restore a fresh verdict.`,
  };
}

export interface RequiredCheckView {
  label: string;
  detail: string | null;
}

/**
 * Mixed `required[]` rendering (ReleaseTab precedent — never the engine
 * `join` on mixed arrays; C11 depends on this too). Strings verbatim;
 * `{regression_no_worse_than}` in plain words; anything else as JSON.
 */
export function describeRequiredCheck(check: unknown): RequiredCheckView {
  if (typeof check === 'string') {
    return { label: check, detail: null };
  }
  if (typeof check === 'object' && check !== null) {
    const bound = (check as Record<string, unknown>).regression_no_worse_than;
    if (typeof bound === 'number' && Number.isFinite(bound)) {
      return {
        label: 'regression bound',
        detail: `Score may not drop more than ${bound} vs the previous published version on the same dataset.`,
      };
    }
    return { label: 'custom check', detail: JSON.stringify(check) };
  }
  return { label: 'custom check', detail: JSON.stringify(check) };
}

/**
 * Seeded-vs-custom dataset origin (single source — DatasetsView imports
 * this; the classifier lives here, not in two places).
 */
export function describeDatasetOrigin(name: string): string {
  if (!name.startsWith('template:')) return 'Custom';
  const rest = name.slice('template:'.length);
  const at = rest.lastIndexOf('@');
  if (at <= 0) return 'Custom';
  return `Seeded by ${rest.slice(0, at)}@${rest.slice(at + 1)}`;
}

export interface EvaluationGrade {
  subtitle: string | null;
  hint: string;
  status: 'locked' | 'untouched' | 'ready' | 'attention' | 'info';
}

/**
 * Evaluation-satellite grade (gate SIGNAL, not a gate — C14 owns the
 * ceremony). Running outranks stale; stale outranks verdicts; shadow-only
 * and undecided histories render honestly instead of ghosting.
 */
export function gradeEvaluation(input: {
  hasRunnableVersion: boolean;
  running: boolean;
  latest: { decision: EvalDecision; stale: boolean; shadow: boolean } | null;
  hasShadowRuns: boolean;
  lastFailed: boolean;
  hasRuns: boolean;
}): EvaluationGrade {
  if (!input.hasRunnableVersion) {
    return { subtitle: 'No runnable version', hint: 'Save a draft first', status: 'locked' };
  }
  if (input.running) {
    return { subtitle: 'Evaluating…', hint: 'The run lands here with its decision', status: 'info' };
  }
  if (!input.latest) {
    if (input.lastFailed) {
      return { subtitle: 'Last run failed — re-evaluate', hint: 'The run failed before deciding', status: 'attention' };
    }
    if (input.hasShadowRuns) {
      return { subtitle: 'Shadow observations only', hint: 'Shadow — never gates. Run a formal eval to earn a verdict', status: 'info' };
    }
    if (input.hasRuns) {
      return { subtitle: 'Runs recorded — no decision yet', hint: 'Legacy or undecided runs only — evaluate to earn a verdict', status: 'info' };
    }
    return { subtitle: null, hint: 'No eval runs yet — evaluate to earn a verdict', status: 'untouched' };
  }
  if (input.latest.shadow) {
    return { subtitle: 'Shadow observations only', hint: 'Shadow — never gates. Run a formal eval to earn a verdict', status: 'info' };
  }
  if (input.latest.stale) {
    return { subtitle: 'Stale decision — re-run', hint: 'The draft moved since this verdict — re-run', status: 'attention' };
  }
  switch (input.latest.decision) {
    case 'BLOCK':
      return { subtitle: 'BLOCKed — resolve and re-evaluate', hint: 'BLOCKed content cannot publish or promote', status: 'attention' };
    case 'WARN':
      return { subtitle: 'WARN — check required checks', hint: 'Shippable unless the template declares required checks', status: 'attention' };
    case 'PASS':
      return { subtitle: 'PASS — shippable', hint: 'A later PASS clears any earlier verdict', status: 'ready' };
  }
}

/**
 * No-dataset error matcher: the engine emits 400 (not 422) with a
 * `dataset_id` details key (`assistants.service.ts:1018-1021`,
 * `api-error.ts:127-129`). Copy never names the code — it names the fix.
 */
export function isNoDatasetError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 400) {
    return false;
  }
  const details = error.details;
  return typeof details === 'object' && details !== null && 'dataset_id' in details;
}

export interface EvalRunLite {
  assistantVersionId: string | null;
  state: string;
  decision: string | null;
  isShadow: boolean;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface VersionRowLite {
  id: string;
  status: string | null;
  updatedAt: string | null;
}

export interface VersionEvalState {
  running: boolean;
  latest: { decision: EvalDecision; stale: boolean; shadow: boolean } | null;
  hasShadowRuns: boolean;
  lastFailed: boolean;
  hasRuns: boolean;
}

/**
 * Newest-first ordering by timestamps (finished, else started). Stable —
 * ties keep wire order. Every surface reads runs through this, never the
 * raw wire order.
 */
export function orderRunsNewestFirst<R extends { finishedAt: string | null; startedAt: string | null }>(runs: R[]): R[] {
  return [...runs].sort((a, b) =>
    (b.finishedAt ?? b.startedAt ?? '').localeCompare(a.finishedAt ?? a.startedAt ?? ''),
  );
}

/**
 * Single derivation of a version's eval state (projector + section share
 * it — never two derivations). Newest-first by timestamps; ties keep wire
 * order (stable sort). Staleness uses the gate-honest timestamp rule.
 */
export function selectVersionEvalState(runs: EvalRunLite[], version: VersionRowLite | null): VersionEvalState | undefined {
  if (!version) {
    return undefined;
  }
  const ordered = orderRunsNewestFirst(
    runs.filter((run) => run.assistantVersionId === version.id),
  );
  const running = ordered.some((run) => run.state === 'pending' || run.state === 'running');
  const completed = ordered.filter((run) => run.state === 'completed');
  const formal = completed.filter(
    (run): run is EvalRunLite & { decision: string } => !run.isShadow && (run.decision === 'PASS' || run.decision === 'WARN' || run.decision === 'BLOCK'),
  );
  const shadowDecided = completed.filter(
    (run): run is EvalRunLite & { decision: string } => run.isShadow && (run.decision === 'PASS' || run.decision === 'WARN' || run.decision === 'BLOCK'),
  );
  let latest: VersionEvalState['latest'] = null;
  const firstFormal = formal[0] ?? null;
  if (firstFormal) {
    latest = {
      decision: firstFormal.decision as EvalDecision,
      stale: evalFreshness({ versionStatus: version.status, versionUpdatedAt: version.updatedAt, runFinishedAt: firstFormal.finishedAt }) !== 'fresh',
      shadow: false,
    };
  } else if (shadowDecided[0]) {
    latest = { decision: shadowDecided[0].decision as EvalDecision, stale: false, shadow: true };
  }
  return {
    running,
    latest,
    hasShadowRuns: ordered.some((run) => run.isShadow),
    lastFailed: ordered.length > 0 && ordered[0].state === 'failed' && !latest,
    hasRuns: completed.length > 0,
  };
}
