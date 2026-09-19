/**
 * C13 pure model — try-console bounds, copy, and descriptors.
 *
 * Engine binds (verified 2026-09-18, PLAN.md §1):
 * - prompt 1–8192 chars: controller owns the lower bound
 *   (`assistants.controller.ts:229-231`), the service owns the upper
 *   (`assistants.service.ts:1468-1471`).
 * - run_kind='test': no quota reserve (`conversations.service.ts:444-450`),
 *   no usage-ledger row (`conversations.service.ts:1586`), draft snapshot
 *   synthesized (`assistants.service.ts:1477`).
 * - wall-clock stop: watchdog → `failRunForBudget` → FAILED +
 *   `run.failed`/`budget_exceeded` + quota release
 *   (`conversations.service.ts:2249-2341`). NO engine cost-stop exists —
 *   cost lines render only from Studio-reported events (SPEC correction D2).
 * - guardrail verdicts are Studio-resolved; the engine records policy
 *   identifiers only (`mcp-authority.service.ts:1962-1964`).
 * - instructions are publish-only (`validation.ts:182-190`) — advisory for try.
 */

/** Prompt bounds — mirrors the service (`assistants.service.ts:1469`). */
export const TRY_PROMPT_MIN = 1;
export const TRY_PROMPT_MAX = 8192;

export type TryPhase = 'idle' | 'sending' | 'streaming' | 'accepted' | 'done' | 'error';

/** Copy constants — every string traces to a bind or a PLAN decision. */
export const TRY_COPY = {
  promptRequired: 'Write a prompt first — test prompts are 1–8192 characters.',
  promptTooLong: 'Test prompts are 1–8192 characters.',
  /** Proven trio only — invisibility is NOT promised (SPEC correction D3). */
  noBill: 'Test runs never bill, never reserve quota, and never touch the draft.',
  draftIntact: 'Draft intact — trying never edits the version.',
  /** The trace is honest observation, never causal proof (SPEC §Trace). */
  traceHonesty: 'What the run saw — not proof of why.',
  reportedOnly: 'Only what the run reported. Nothing inferred.',
  loggingNotBlock: 'Logged, not blocked — this verdict never stopped the run.',
  /** Reload restores the pointer; the engine holds the thread. */
  reloadRestored: 'Thread restored from the server — the live tail replays from the last event.',
  /** Test runs write no ledger row (`conversations.service.ts:1586` gate). */
  noBillRow: 'Test runs write no bill row — measured spend lives in Usage.',
  instructionsAdvisory: 'No instructions yet — try runs, publish refuses.',
  noRunnableVersion: 'No DRAFT or PUBLISHED version to run — save a draft first.',
  noUsableModel: 'No usable model — connect a credential first.',
  activeRunConflict: 'A run is already active on this thread — wait for it or stop it, then re-ask.',
  threadKept: 'Thread kept in ?try= — reload restores it.',
} as const;

export function validateTryPrompt(raw: string): { ok: true } | { ok: false; error: string } {
  const text = raw.trim();
  if (text.length < TRY_PROMPT_MIN) {
    return { ok: false, error: TRY_COPY.promptRequired };
  }
  if (text.length > TRY_PROMPT_MAX) {
    return { ok: false, error: TRY_COPY.promptTooLong };
  }
  return { ok: true };
}

export type TryPrereqKind = 'no-version' | 'no-model' | 'instructions-advisory';

export interface TryPrereq {
  kind: TryPrereqKind;
  /** 'block' refuses the run; 'advisory' whispers and lets it through. */
  tone: 'block' | 'advisory';
  headline: string;
  detail: string;
}

/**
 * Ordered prerequisite descriptors. Blocks sort before the advisory whisper;
 * a ready console returns an empty list.
 */
export function describeTryPrereqs(input: {
  hasRunnableVersion: boolean;
  usableModelCount: number;
  hasInstructions: boolean;
}): TryPrereq[] {
  const prereqs: TryPrereq[] = [];
  if (!input.hasRunnableVersion) {
    prereqs.push({
      kind: 'no-version',
      tone: 'block',
      headline: TRY_COPY.noRunnableVersion,
      detail: 'Runs pin a version snapshot — drafts synthesize one server-side.',
    });
  }
  if (input.usableModelCount < 1) {
    prereqs.push({
      kind: 'no-model',
      tone: 'block',
      headline: TRY_COPY.noUsableModel,
      detail: 'A try needs at least one usable model on the version.',
    });
  }
  if (input.hasInstructions === false) {
    prereqs.push({
      kind: 'instructions-advisory',
      tone: 'advisory',
      headline: TRY_COPY.instructionsAdvisory,
      detail: 'Advisory only here — publish refuses until instructions exist.',
    });
  }
  return prereqs;
}

export type TryStopKind = 'wall-clock' | 'reported' | 'failed' | 'none';

export interface TryStop {
  kind: TryStopKind;
  headline: string;
  detail: string;
}

/**
 * Stop-line descriptor. The wall-clock shape is engine-bound (FAILED +
 * `budget_exceeded`); everything else renders from what Studio reported,
 * never merged into one "limit" line (SPEC correction D2).
 */
export function describeTryStop(input: { state: string | null; reason: string | null }): TryStop {
  const state = (input.state ?? '').toLowerCase();
  const reason = (input.reason ?? '').toLowerCase();
  const wallClock = reason.includes('budget_exceeded') || reason.includes('wall_clock');
  if (state.includes('fail') && wallClock) {
    return {
      kind: 'wall-clock',
      headline: 'FAILED · budget_exceeded_wall_clock.',
      detail: 'The wall-clock watchdog fails the run closed — terminal event names the dimension.',
    };
  }
  if (state.includes('fail')) {
    return {
      kind: 'failed',
      headline: `The run ended with state "${input.state ?? 'failed'}".`,
      detail: input.reason ? `Reported reason: ${input.reason}.` : 'No reason was reported — re-ask or check Status.',
    };
  }
  if (reason.includes('budget') || reason.includes('cost') || reason.includes('usage')) {
    return {
      kind: 'reported',
      headline: `Stopped: ${input.reason ?? 'reported limit'}.`,
      detail: 'Reported by Studio — cost lines report only, they never fail the run engine-side.',
    };
  }
  return { kind: 'none', headline: '', detail: '' };
}

/** A retrieval hit the run itself reported — never synthesized. */
export interface ReportedHit {
  title: string | null;
  chunk: string | null;
  score: number | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Permissive extractor for retrieval hits inside an opaque run-event
 * payload. Tolerates camel/snake shapes; unknown shapes yield nothing —
 * the trace renders only what arrived (§reportedOnly).
 */
export function extractReportedHits(payload: unknown): ReportedHit[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const record = payload as Record<string, unknown>;
  const candidates = [record.hits, record.chunks, record.results, record.retrieved].find(Array.isArray);
  const list = (Array.isArray(candidates) ? candidates : [record]).filter(
    (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
  );
  const hits: ReportedHit[] = [];
  for (const entry of list) {
    const title = str(entry.title) ?? str(entry.document_title) ?? str(entry.documentId) ?? str(entry.document_id);
    const chunkIndex = num(entry.chunk_index) ?? num(entry.chunkIndex);
    const chunk =
      str(entry.chunk) ?? str(entry.chunk_id) ?? str(entry.chunkId) ?? (chunkIndex !== null ? `chunk ${chunkIndex}` : null);
    const score = num(entry.score) ?? num(entry.similarity);
    if (title !== null || chunk !== null || score !== null) {
      hits.push({ title, chunk, score });
    }
  }
  // A lone record that carried no hit fields is not a hit.
  return hits;
}

export interface GuardrailRow {
  policy: string;
  mode: 'blocking' | 'logging';
  verdict: string | null;
}

/** A guardrail verdict the run itself reported — Studio-resolved. */
export interface ReportedVerdict {
  policy: string;
  verdict: string | null;
}

/**
 * Permissive extractor for guardrail verdicts inside an opaque run-event
 * payload. Tolerates {policy, verdict} / {guardrail, decision} shapes;
 * unknown shapes yield nothing — verdicts are never synthesized.
 */
export function extractReportedVerdicts(payload: unknown): ReportedVerdict[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const record = payload as Record<string, unknown>;
  const list = [record.verdicts, record.guardrails, record.policies].find(Array.isArray);
  const entries = (Array.isArray(list) ? list : [record]).filter(
    (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
  );
  const verdicts: ReportedVerdict[] = [];
  for (const entry of entries) {
    const policy = str(entry.policy) ?? str(entry.guardrail) ?? str(entry.name);
    if (policy === null) continue;
    verdicts.push({ policy, verdict: str(entry.verdict) ?? str(entry.decision) ?? str(entry.result) });
  }
  return verdicts;
}

/**
 * Guardrail row descriptor. The verdict is Studio-reported (engine records
 * policy identifiers only); logging mode always carries the not-a-block
 * suffix — logging verdicts must never read as blocks.
 */
export function describeGuardrailRow(row: GuardrailRow): string {
  const head = row.verdict ? `${row.policy} · ${row.verdict} · ${row.mode}` : `${row.policy} · ${row.mode}`;
  return row.mode === 'logging' ? `${head} — ${TRY_COPY.loggingNotBlock}` : head;
}

export interface ToolRow {
  tool: string;
  approval: string | null;
  effect: string | null;
  result: 'ok' | 'failed' | 'shadow' | null;
}

/** Tool-call row descriptor — shadow renders as simulated, never gating. */
export function describeToolRow(row: ToolRow): string {
  const parts = [row.tool];
  if (row.approval) parts.push(row.approval);
  if (row.effect) parts.push(row.effect);
  if (row.result === 'shadow') parts.push('shadow — simulated, gated nothing');
  else if (row.result) parts.push(row.result);
  return parts.join(' · ');
}

export interface ResponseGrade {
  subtitle: string | null;
  hint: string;
  status: 'locked' | 'untouched' | 'ready' | 'attention';
}

/**
 * Response-spine grade (usability only — try never gates publish).
 * `nowMs` is injected for purity; `lastTryAt` is an ISO timestamp or null.
 */
export function gradeResponse(input: {
  hasRunnableVersion: boolean;
  lastTryAt: string | null;
  lastTryFailed: boolean;
  nowMs: number;
}): ResponseGrade {
  if (!input.hasRunnableVersion) {
    return { subtitle: 'No runnable version', hint: 'Save a draft first', status: 'locked' };
  }
  if (input.lastTryAt === null) {
    return { subtitle: null, hint: 'Not tried yet — run a prompt', status: 'untouched' };
  }
  if (input.lastTryFailed) {
    return { subtitle: 'Last try stopped', hint: 'Open Try for the stop line', status: 'attention' };
  }
  const elapsedMs = input.nowMs - Date.parse(input.lastTryAt);
  const elapsed = Number.isFinite(elapsedMs) && elapsedMs >= 0 ? elapsedMs : 0;
  const subtitle =
    elapsed < 60_000 ? 'Tried just now' : elapsed < 3_600_000 ? `Tried ${Math.floor(elapsed / 60_000)}m ago` : `Tried ${Math.floor(elapsed / 3_600_000)}h ago`;
  return { subtitle, hint: 'Thread kept in Try', status: 'ready' };
}
