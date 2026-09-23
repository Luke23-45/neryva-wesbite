/**
 * C14 pure model — publish readiness math, refusal classification, copy.
 *
 * Engine binds (verified 2026-09-18, PLAN.md §1):
 * - refusal stack: 404 → 400 status/shape/secrets/models/instructions/tools
 *   → 409 no-op (joint) → 409 BLOCK → 409 required → 400 degraded
 *   (`assistants.service.ts:693-802,1844-1896`; `release-gate.ts:28-63`;
 *   `ApiError.validation` = 400, `conflict` = 409 per `api-error.ts:127-137`).
 * - no 412 on publish/rollback (OCC lives on PUT draft only); success POST
 *   returns `{ version }` only; required list is string-only server-side;
 *   approvals / control-blocks / drift-as-refusal are NOT gates (PLAN §8 D8).
 */
import { ApiError } from '@lib/engine/client';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { describeRequiredCheck, evalFreshness, orderRunsNewestFirst } from './eval-model';

/** Server-publishable version statuses (`assistants.service.ts:708`). */
export const PUBLISHABLE_STATUSES = ['DRAFT', 'VALID', 'VALIDATING'] as const;

export function isPublishableStatus(status: string | null): boolean {
  return status !== null && (PUBLISHABLE_STATUSES as readonly string[]).includes(status);
}

/** Verbatim engine refusal message shapes (prefix-matched, never reworded). */
export const REFUSAL_TEXT = {
  /** Legacy/null-manifest no-op (`assistants.service.ts:1884`). PREFIX of the joint text — match joint first. */
  noOpLegacy: 'assistant active version already carries this payload',
  /** Joint content+manifest no-op (`assistants.service.ts:1889-1890`). */
  noOpJoint: 'assistant active version already carries this payload and resolved set',
  /** BLOCK gate (`release-gate.ts:34-35`). */
  blockedContent: 'the latest evaluation of this content decided BLOCK',
  /** FAIL gate (`release-gate.ts` — A2-80). */
  failedContent: 'the latest evaluation of this content decided FAIL',
  /** Required-checks gate (`release-gate.ts:60`). */
  requiredChecks: 'release policy requires a fresh PASS',
} as const;

export type PublishRefusalKind =
  | 'no-op'
  | 'blocked-content'
  | 'failed-content'
  | 'required-checks'
  | 'degraded'
  | 'status'
  | 'payload'
  | 'models'
  | 'tools'
  | 'instructions'
  | 'unknown';

function detailsOf(error: ApiError): Record<string, unknown> {
  return typeof error.details === 'object' && error.details !== null
    ? (error.details as Record<string, unknown>)
    : {};
}

/**
 * Typed publish/rollback refusal (409 ×3 shapes, 400 ×4 shapes). Message
 * prefixes match the engine verbatim; details keys disambiguate the 400s.
 * Anything else is 'unknown' — rendered verbatim, never paraphrased.
 */
export function classifyPublishRefusal(error: unknown): PublishRefusalKind {
  if (!(error instanceof ApiError)) {
    return 'unknown';
  }
  const message = error.message ?? '';
  if (message.startsWith(REFUSAL_TEXT.noOpJoint) || message === REFUSAL_TEXT.noOpLegacy) {
    return 'no-op';
  }
  if (message.startsWith(REFUSAL_TEXT.blockedContent)) {
    return 'blocked-content';
  }
  if (message.startsWith(REFUSAL_TEXT.failedContent)) {
    return 'failed-content';
  }
  if (message.startsWith(REFUSAL_TEXT.requiredChecks)) {
    return 'required-checks';
  }
  const details = detailsOf(error);
  if ('knowledge_pins' in details) {
    return 'degraded';
  }
  if ('tool_policy' in details) {
    return 'tools';
  }
  if ('model_policy' in details || 'residency' in details) {
    return 'models';
  }
  if ('instructions' in details) {
    return 'instructions';
  }
  if ('status' in details) {
    return 'status';
  }
  if (error.status === 400) {
    return 'payload';
  }
  return 'unknown';
}

/** Where a failing row sends the maker (in-builder jump, deep link, or both). */
export type PublishEditTarget = 'purpose' | 'brain' | 'knowledge' | 'tools' | 'evaluation';

export interface RefusalFix {
  title: string;
  fixLabel: string;
  /** Library deep link (detail surfaces; null when the fix is in-place). */
  fixRoute: string | null;
  /** Builder slot jump (builder surfaces; null when the fix is library-only). */
  editTarget: PublishEditTarget | null;
}

/** Console fix routes (verified `routes.tsx:322,449-486,534`). */
export const PUBLISH_FIX_ROUTES = {
  models: '/agent-studio/models',
  tools: '/agent-studio/tools',
  knowledge: '/agent-studio/knowledge',
  evaluations: '/agent-studio/evaluations',
  datasets: '/agent-studio/datasets',
  channels: '/agent-studio/channels',
  audit: '/platform/audit',
} as const;

export function refusalFix(kind: PublishRefusalKind): RefusalFix {
  switch (kind) {
    case 'no-op':
      return {
        title: 'No changes to publish',
        fixLabel: 'View the live version',
        fixRoute: null,
        editTarget: null,
      };
    case 'blocked-content':
      return {
        title: 'BLOCKed content cannot publish',
        fixLabel: 'Evaluate this version',
        fixRoute: PUBLISH_FIX_ROUTES.evaluations,
        editTarget: 'evaluation',
      };
    case 'failed-content':
      return {
        title: 'Failed content cannot publish',
        fixLabel: 'Fix the failing cases',
        fixRoute: PUBLISH_FIX_ROUTES.evaluations,
        editTarget: 'evaluation',
      };
    case 'required-checks':
      return {
        title: 'Required checks need a fresh PASS',
        fixLabel: 'Evaluate this version',
        fixRoute: PUBLISH_FIX_ROUTES.evaluations,
        editTarget: 'evaluation',
      };
    case 'degraded':
      return {
        title: 'Degraded knowledge needs an explicit ack',
        fixLabel: 'Map the pins',
        fixRoute: PUBLISH_FIX_ROUTES.knowledge,
        editTarget: 'knowledge',
      };
    case 'status':
      return {
        title: 'This version cannot publish from its status',
        fixLabel: 'Save a fresh draft',
        fixRoute: null,
        editTarget: 'purpose',
      };
    case 'payload':
      return {
        title: 'The draft payload is invalid',
        fixLabel: 'Review the failing fields',
        fixRoute: null,
        editTarget: 'purpose',
      };
    case 'models':
      return {
        title: 'Model refs are unknown or unserved',
        fixLabel: 'Pick published models',
        fixRoute: PUBLISH_FIX_ROUTES.models,
        editTarget: 'brain',
      };
    case 'tools':
      return {
        title: 'Tool pins were rejected',
        fixLabel: 'Re-pin the tools',
        fixRoute: PUBLISH_FIX_ROUTES.tools,
        editTarget: 'tools',
      };
    case 'instructions':
      return {
        title: 'Instructions are required to publish',
        fixLabel: 'Write instructions',
        fixRoute: null,
        editTarget: 'purpose',
      };
    case 'unknown':
      return {
        title: 'Publish refused',
        fixLabel: 'Read the exact refusal',
        fixRoute: null,
        editTarget: null,
      };
  }
}

export type RequiredGateState = 'pass' | 'fail' | 'not-declared';

export interface RequiredGateView {
  state: RequiredGateState;
  /** Rendered check labels (objects in plain words — never a joined mix). */
  checks: Array<{ label: string; detail: string | null }>;
  headline: string;
}

/**
 * Required-checks pre-flight (server rule: `release-gate.ts:48-63` — PASS
 * only passes; WARN/BLOCK/absent refuse). Freshness uses the C10 timestamp
 * rule: a decision the draft has since out-edited is not fresh, and missing
 * timestamps prove nothing (fail, naming re-run as the fix).
 */
export function evaluateRequiredGate(input: {
  required: unknown[];
  decision: string | null;
  freshness: 'fresh' | 'stale' | 'unknown';
  finishedAt: string | null;
}): RequiredGateView {
  const checks = input.required.map(describeRequiredCheck);
  if (input.required.length === 0) {
    return { state: 'not-declared', checks, headline: 'No template-declared checks — the BLOCK gate still applies.' };
  }
  const names = checks.map((c) => c.label).join(', ');
  if (input.decision !== 'PASS') {
    return {
      state: 'fail',
      checks,
      headline: `Release policy requires a fresh PASS evaluation (checks: ${names}); the latest decision is ${input.decision ?? 'absent'} — evaluate this version, then publish.`,
    };
  }
  if (input.freshness !== 'fresh') {
    return {
      state: 'fail',
      checks,
      headline: `PASS is not fresh for this content (ran ${input.finishedAt ?? 'unknown time'}) — re-run, then publish.`,
    };
  }
  return { state: 'pass', checks, headline: 'A fresh PASS on this content hash exists.' };
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? '';
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`);
  return `{${entries.join(',')}}`;
}

/**
 * No-change hint (advisory ONLY): deep-equal definitions mean the content
 * hash almost surely matches, but a drifted manifest still makes publish
 * legitimate (`assistants.service.ts:1849-1851`) — so this never disables
 * the button, it only arms the muted copy.
 */
export function detectNoChangeHint(draftDefinition: unknown, activeDefinition: unknown | null): boolean {
  if (activeDefinition === null || activeDefinition === undefined) {
    return false;
  }
  return stableStringify(draftDefinition) === stableStringify(activeDefinition);
}

export type ReadinessVerdict = 'go' | 'conditional-go' | 'no-go' | 'unknown';

export interface ReadinessRowState {
  ok: boolean | null;
  /** Degraded-knowledge is the only ackable gate (server waives nothing else). */
  ackable: boolean;
  acked: boolean;
}

/**
 * Verdict math (PLAN §2 R2): Go / Conditional-Go-with-named-exception /
 * No-Go — never a percentage. Loading (any null) is unknown, never red.
 */
export function readinessVerdict(rows: ReadinessRowState[]): ReadinessVerdict {
  if (rows.length === 0) {
    return 'unknown';
  }
  if (rows.some((row) => row.ok === null)) {
    return 'unknown';
  }
  const unacked = rows.filter((row) => row.ok === false && !(row.ackable && row.acked));
  if (unacked.length > 0) {
    return 'no-go';
  }
  if (rows.some((row) => row.ok === false)) {
    return 'conditional-go';
  }
  return 'go';
}

export interface ShipGrade {
  subtitle: string | null;
  hint: string;
  status: 'locked' | 'untouched' | 'ready' | 'attention' | 'info';
}

/**
 * Ship-spine grade (PLAN §6 — usability signal; the ceremony lives in the
 * section/panel). Attention is the publish-refuses color (purpose/brain/
 * knowledge precedent); loading is neutral, never red.
 */
export function gradeShip(input: {
  locked: boolean;
  readiness: { verdict: ReadinessVerdict; blockers: number; checking: boolean } | null;
}): ShipGrade {
  if (input.locked) {
    return { subtitle: null, hint: 'Create the agent first', status: 'locked' };
  }
  if (!input.readiness || input.readiness.checking) {
    return { subtitle: 'Checking gates…', hint: 'Readiness reads are landing', status: 'info' };
  }
  switch (input.readiness.verdict) {
    case 'go':
      return { subtitle: 'All gates pass — ready to publish', hint: 'Open Ship to release', status: 'ready' };
    case 'conditional-go':
      return {
        subtitle: 'Degraded ack armed — ships degraded (audited)',
        hint: 'The waiver is named, explicit, and expires in 7 days',
        status: 'info',
      };
    case 'no-go':
      return {
        subtitle: `${input.readiness.blockers} blocker${input.readiness.blockers === 1 ? '' : 's'} — publish explains on click`,
        hint: 'Every blocker carries its fix path',
        status: 'attention',
      };
    case 'unknown':
      return { subtitle: null, hint: 'Publish gates land here', status: 'untouched' };
  }
}

export type PublishGateId = 'shape' | 'models' | 'tools' | 'block' | 'required' | 'knowledge';

export interface PublishReadinessRow {
  id: PublishGateId;
  title: string;
  detail: string;
  /** Rendered required-check labels (required row only, else null). */
  extra: string[] | null;
  /** null = still loading (neutral, never red). */
  ok: boolean | null;
  /** Degraded-knowledge is the only ackable gate — the server waives nothing else. */
  ackable: boolean;
  fix: RefusalFix;
}

export interface PublishVersionLite {
  id: string;
  version: number;
  status: string | null;
  hash: string | null;
  updatedAt: string | null;
  definition: ConsumerDefinition;
}

export interface PublishEvalRunLite {
  assistantVersionId: string | null;
  state: string;
  decision: string | null;
  isShadow: boolean;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface ReadinessInputs {
  /** The draft under review (null while versions load, or when it is gone). */
  version: PublishVersionLite | null;
  versionsLoaded: boolean;
  activeDefinition: ConsumerDefinition | null;
  templateRequired: unknown[];
  /** False while provenance/the template row is still loading (never a false pass). */
  templateLoaded: boolean;
  models: Array<{ ref: string; usable: boolean }> | undefined;
  catalog: Array<{ name: string; enabled: boolean | null; hash: string | null }> | undefined;
  toolBuiltins: readonly string[];
  healthPins: Array<{ sourceSlug: string; resolved: boolean; state: string | null; embeddingComplete: boolean | null }> | undefined;
  libraryStates: Record<string, string | undefined>;
  documentsLoaded: boolean;
  evalRuns: PublishEvalRunLite[] | undefined;
  acknowledged: boolean;
}

export interface DerivedReadiness {
  rows: PublishReadinessRow[];
  verdict: ReadinessVerdict;
  publishable: boolean;
  needsAcknowledge: boolean;
  unresolvedSlugs: string[];
  unreadySlugs: string[];
  noChangeHint: boolean;
  decision: string | null;
  decisionFinishedAt: string | null;
  evalRunning: boolean;
}

const READINESS_EMPTY: DerivedReadiness = {
  rows: [],
  verdict: 'unknown',
  publishable: false,
  needsAcknowledge: false,
  unresolvedSlugs: [],
  unreadySlugs: [],
  noChangeHint: false,
  decision: null,
  decisionFinishedAt: null,
  evalRunning: false,
};

/**
 * The publish gate read, derived once (PLAN §5 — the hook feeds it query
 * data; the ship section and the detail panel share the hook's output,
 * never two derivations). Pre-flight mirrors the server order
 * (`assistants.service.ts:693-802`): shape → models → tools → BLOCK →
 * required → degraded. Composed reads only — no dedicated required-checks
 * endpoint exists (PLAN §8 D1).
 */
export function derivePublishReadiness(input: ReadinessInputs): DerivedReadiness {
  const { version } = input;
  if (!version) {
    if (!input.versionsLoaded) {
      return READINESS_EMPTY;
    }
    return {
      ...READINESS_EMPTY,
      rows: [
        {
          id: 'shape',
          title: 'Version not found',
          detail: 'This version is gone — it may have been discarded. Pick another draft.',
          extra: null,
          ok: false,
          ackable: false,
          fix: refusalFix('status'),
        },
      ],
    };
  }
  const definition = version.definition;

  // Newest completed formal (non-shadow) decision for THIS version — the
  // server keys BLOCK + required by content hash over non-shadow runs
  // (`release-gate.ts:100-114`); the console approximates with the version
  // row + timestamp rule (PLAN §8 D1, C10 D10).
  const orderedRuns = orderRunsNewestFirst(
    (input.evalRuns ?? []).filter(
      (run) => run.assistantVersionId === version.id && !run.isShadow && run.state === 'completed',
    ),
  );
  const latestFormal =
    orderedRuns.find((run) => run.decision === 'PASS' || run.decision === 'WARN' || run.decision === 'BLOCK' || run.decision === 'FAIL') ?? null;
  const decision = latestFormal?.decision ?? null;
  const decisionFinishedAt = latestFormal?.finishedAt ?? null;
  const evalRunning = (input.evalRuns ?? []).some(
    (run) => run.assistantVersionId === version.id && (run.state === 'pending' || run.state === 'running'),
  );

  const blank = (id: PublishGateId, title: string, fix: RefusalFix): PublishReadinessRow => ({
    id,
    title,
    detail: 'Checking…',
    extra: null,
    ok: null,
    ackable: false,
    fix,
  });

  const rows: PublishReadinessRow[] = [];

  // — Shape + instructions (checkDefinitionCaps: instructions, sizes, secrets) —
  {
    const capsIssues = checkDefinitionCaps(definition);
    rows.push({
      id: 'shape',
      title: 'Shape + instructions',
      detail:
        capsIssues.length === 0 ? 'Caps pre-check passes locally (the engine re-validates).' : capsIssues[0].message,
      extra: null,
      ok: capsIssues.length === 0,
      ackable: false,
      fix: refusalFix('payload'),
    });
  }

  // — Models in catalog + residency served —
  if (input.models === undefined) {
    rows.push(blank('models', 'Models in catalog + residency served', refusalFix('models')));
  } else {
    const allowed = definition.model_policy.allowed_models;
    const usableByRef = new Map(input.models.map((m) => [m.ref, m.usable]));
    const unknownModels = allowed.filter((ref) => !usableByRef.has(ref));
    const unusableModels = allowed.filter((ref) => usableByRef.get(ref) === false);
    rows.push({
      id: 'models',
      title: 'Models in catalog + residency served',
      detail:
        allowed.length === 0
          ? 'No model yet — pick one before publishing.'
          : unknownModels.length > 0
            ? `Unknown to the catalog: ${unknownModels.join(', ')} — pick published models.`
            : unusableModels.length > 0
              ? `Unusable (credentials/enablement/residency): ${unusableModels.join(', ')} — see Models.`
              : 'Every allowed model is usable at this org.',
      extra: null,
      ok: allowed.length > 0 && unknownModels.length === 0 && unusableModels.length === 0,
      ackable: false,
      fix: refusalFix('models'),
    });
  }

  // — Tool pins fresh (server messages verbatim: service.ts:1341-1345) —
  if (input.catalog === undefined) {
    rows.push(blank('tools', 'Tool pins fresh', refusalFix('tools')));
  } else {
    const catalogByName = new Map(input.catalog.map((t) => [t.name, t]));
    const pinProblems: string[] = [];
    for (const tool of definition.tools) {
      if (input.toolBuiltins.includes(tool.name)) {
        continue;
      }
      const row = catalogByName.get(tool.name);
      if (!row || row.enabled !== true) {
        pinProblems.push(`${tool.name}: not present in the tool catalog or disabled`);
      } else if (tool.schema_hash && row.hash && tool.schema_hash !== row.hash) {
        pinProblems.push(`${tool.name}: schema_hash does not match the catalog entry (pin is stale)`);
      }
    }
    rows.push({
      id: 'tools',
      title: 'Tool pins fresh',
      detail: pinProblems.length === 0 ? 'Built-ins and enabled rows cover every entry.' : pinProblems.join('; '),
      extra: null,
      ok: pinProblems.length === 0,
      ackable: false,
      fix: refusalFix('tools'),
    });
  }

  // — BLOCK/FAIL gate (latest-wins, content-hash keyed; shadow never gates) —
  if (input.evalRuns === undefined) {
    rows.push(blank('block', 'BLOCK/FAIL gate (latest-wins, content-hash keyed)', refusalFix('blocked-content')));
  } else {
    rows.push({
      id: 'block',
      title: 'BLOCK/FAIL gate (latest-wins, content-hash keyed)',
      detail:
        decision === 'BLOCK'
          ? 'The latest evaluation of this content decided BLOCK — resolve the critical failures and re-evaluate before publishing.'
          : decision === 'FAIL'
            ? 'The latest evaluation of this content decided FAIL — fix the failing cases and re-evaluate before publishing.'
            : decision
              ? `Latest decision: ${decision} — a later PASS clears any earlier verdict.`
              : 'No completed evaluation for this content yet — nothing BLOCKs.',
      extra: null,
      ok: decision !== 'BLOCK' && decision !== 'FAIL',
      ackable: false,
      fix: refusalFix(decision === 'FAIL' ? 'failed-content' : 'blocked-content'),
    });
  }

  // — Required checks (fresh PASS on THIS content where declared) —
  if (input.evalRuns === undefined || !input.templateLoaded) {
    rows.push(blank('required', 'Required checks', refusalFix('required-checks')));
  } else {
    const freshness = evalFreshness({
      versionStatus: version.status,
      versionUpdatedAt: version.updatedAt,
      runFinishedAt: decisionFinishedAt,
    });
    const gate = evaluateRequiredGate({ required: input.templateRequired, decision, freshness, finishedAt: decisionFinishedAt });
    const checks = gate.checks;
    rows.push({
      id: 'required',
      title:
        gate.state === 'not-declared'
          ? 'Required checks (none declared)'
          : `Required checks (${checks.map((c) => c.label).join(', ')})`,
      detail: gate.headline,
      extra: gate.state === 'not-declared' ? null : checks.map((c) => (c.detail ? `${c.label} — ${c.detail}` : c.label)),
      ok: gate.state !== 'fail',
      ackable: false,
      fix: refusalFix('required-checks'),
    });
  }

  // — Knowledge pins resolved (ACTIVE health first, library fallback for
  //   health-silent draft pins — the C05 projector pattern) —
  const healthReady = input.healthPins !== undefined && input.documentsLoaded;
  let unresolvedSlugs: string[] = [];
  let unreadySlugs: string[] = [];
  if (!healthReady) {
    rows.push(blank('knowledge', 'Knowledge pins resolved', refusalFix('degraded')));
  } else {
    const healthBySlug = new Map((input.healthPins ?? []).map((p) => [p.sourceSlug, p]));
    const unresolved: string[] = [];
    const unready: string[] = [];
    for (const slug of definition.context_policy.knowledge_sources) {
      const pin = healthBySlug.get(slug);
      if (pin) {
        if (!pin.resolved) {
          unresolved.push(slug);
        } else if (pin.state !== null && pin.state !== 'ready') {
          unready.push(`${slug} (${pin.state})`);
        } else if (pin.embeddingComplete === false) {
          unready.push(`${slug} (vectors still indexing)`);
        }
        continue;
      }
      const state = input.libraryStates[slug];
      if (state === undefined) {
        unresolved.push(slug);
      } else if (state !== 'ready') {
        unready.push(`${slug} (${state})`);
      }
    }
    unresolvedSlugs = unresolved;
    unreadySlugs = unready;
    rows.push({
      id: 'knowledge',
      title: 'Knowledge pins resolved',
      detail:
        unresolved.length > 0
          ? `Unresolved: ${unresolved.join(', ')} — map the documents, or acknowledge degraded knowledge explicitly.`
          : unready.length > 0
            ? `Not READY: ${unready.join(', ')} — ingestion still running or coverage incomplete.`
            : 'Every declared pin resolves to a READY document.',
      extra: null,
      ok: unresolved.length === 0 && unready.length === 0,
      ackable: true,
      fix: refusalFix('degraded'),
    });
  }

  const verdict = readinessVerdict(
    rows.map((row) => ({ ok: row.ok, ackable: row.ackable, acked: row.ackable && input.acknowledged })),
  );

  return {
    rows,
    verdict,
    publishable: verdict === 'go' || verdict === 'conditional-go',
    needsAcknowledge: unresolvedSlugs.length + unreadySlugs.length > 0,
    unresolvedSlugs,
    unreadySlugs,
    noChangeHint:
      input.activeDefinition !== null ? detectNoChangeHint(definition, input.activeDefinition) : false,
    decision,
    decisionFinishedAt,
    evalRunning,
  };
}

/** Copy constants — every string traces to a bind or a PLAN §2 decision. */export const PUBLISH_COPY = {
  verdictGo: 'Go — all gates pass',
  verdictConditional: 'Conditional Go — 1 named exception',
  verdictNoGo: 'No-Go — fix the blockers',
  verdictUnknown: 'Checking gates…',
  degradedAck:
    'Ship degraded: publish with unresolved knowledge. The agent WILL hallucinate more, and this bypass is audited as assistant.publish_degraded_acknowledged with the slugs. The waiver expires in 7 days.',
  degradedLifecycle: 'A degraded publish starts a 7-day waiver clock — a healthy publish clears it.',
  confirmTitle: 'Publish this draft?',
  confirmMessage:
    'A new PUBLISHED version is inserted and the active pointer swings atomically. In-flight runs stay pinned to superseded versions.',
  confirmMessageDegraded: ' Unresolved knowledge ships degraded (audited, 7-day waiver).',
  noChangeHint:
    'Content identical to the live version — publish re-pins the resolved set if anything drifted, else confirms no-op.',
  requestPublish: 'Publish needs owner or admin — you can draft, test and evaluate. Ask an owner to publish.',
  successLive: 'Live',
  rollbackCreatesNew: 'Rollback births a new version — history is kept, nothing is renamed or re-pointed in place.',
  rollbackNoTouch: 'In-flight runs stay pinned. Rollback reverts no data and no external system.',
  auditPromise: 'Recorded in Audit',
} as const;
