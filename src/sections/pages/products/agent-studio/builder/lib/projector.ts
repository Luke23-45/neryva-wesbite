/**
 * Builder projector (BUILD_PLAN.md §8) — the ONLY function that turns contract
 * truth into canvas truth. Pure: same input → same nodes/edges, which is what
 * makes "no invented states" executable (tests assert ghosts where data is
 * absent). React Flow renders the output; it never derives anything itself.
 *
 * C01 scope (deliberate, recorded): compact + ghost + locked densities only.
 * Expansion, instance rows, and inline controls land with their content
 * passes (C04 Brain dropdown, C05 Knowledge rows, C06 approvals, C13 Try).
 * Statuses a pass hasn't earned yet are never claimed: evaluation with runs
 * is `info` (run truth is the C10 gap). Knowledge earned its grade in C05,
 * tools in C06 (usability from draft entries × catalog rows × pin states).
 */
import type { Edge, Node } from '@xyflow/react';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import {
  KIND_META,
  SKIPPABLE_KINDS,
  SPINE_IDS,
  SPINE_META,
  type SatelliteView,
  type SlotKind,
  type SlotStatus,
  type SpineId,
} from './slot-model';
import { parseInstructions } from './instructions-model';
import { gradeGuardrails, parseGuardrailMode } from './guardrails-model';
import { gradeMemory, parseMemoryScope } from './memory-model';
import { gradeBudget } from './budget-model';
import { gradeEvaluation } from './eval-model';
import { gradeShip } from './publish-model';
import { gradeResponse } from './try-model';
import { firstBlocker, reasonFix, usableRefs, type CatalogRow } from './brain-model';

export interface BuilderNodeData extends Record<string, unknown> {
  slotKey: string;
  nodeType: 'spine' | 'satellite' | 'empty';
  kind: SlotKind | null;
  title: string;
  subtitle: string | null;
  /** Ghost/drop copy (rendered when subtitle is null). */
  hint: string | null;
  status: SlotStatus;
  selected: boolean;
  /** Purpose immutability glyph (no engine rename verb — C01 SPEC). */
  lock: boolean;
  /** Dock-port color (satellites only; null = no port). */
  portColor: string | null;
}

export type BuilderNode = Node<BuilderNodeData>;

export type BuilderEdgeVariant = 'flow' | 'inhibit' | 'verdict';

export interface BuilderEdgeData extends Record<string, unknown> {
  variant: BuilderEdgeVariant;
  lit: boolean;
}

export type BuilderEdge = Edge<BuilderEdgeData>;

export interface ProjectorInput {
  mode: 'new' | 'build';
  assistantName: string | null;
  hasDraft: boolean;
  definition: ConsumerDefinition | null;
  /** Library slugs present (for "n of m mapped" honesty; null = still loading). */
  librarySlugs: string[] | null;
  satellites: SatelliteView[];
  positions: Record<string, { x: number; y: number }>;
  selectedId: string | null;
  skippedIds: string[];
  /** Catalog display lookup; fallback is the raw ref (never blank, never invented). */
  modelLabel: (ref: string) => string;
  /**
   * Model catalog for usability truth (C04). Undefined = still loading (no
   * status is claimed either way); an array — even empty — is a verdict.
   */
  models: readonly CatalogRow[] | undefined;
  /**
   * Tool catalog rows for pin truth (C06). Undefined = still loading (no
   * status is claimed either way); an array — even empty — is a verdict.
   */
  toolCatalog?: readonly ToolCatalogRow[] | undefined;
  /** Built-in tool names (no catalog row needed — always pinnable). */
  toolBuiltins?: readonly string[];
  /**
   * ACTIVE-version pin health (C05, useKnowledgeHealth). Undefined = still
   * loading (neutral, never a false green); null = no assistant to read
   * (new mode — the draft stands alone). Health only grades slugs it knows:
   * draft pins absent from the response fall back to library mapping, and
   * coverage is never claimed for them (publish resolves it).
   */
  knowledgeHealth?: { degraded: boolean; pins: HealthPin[] } | null;
  /**
   * Try state for the response-spine grade (C13). Undefined = unknown
   * (pre-C13 placeholder copy); present = graded. Usability only — try
   * never gates publish, so no bottom-action input reads this.
   */
  tryState?: { hasRunnableVersion: boolean; lastTryAt: string | null; lastTryFailed: boolean } | undefined;
  /**
   * Eval state for the evaluation-satellite grade (C10). Undefined =
   * unknown (ghost copy); present = graded. Gate SIGNAL only — C14 owns
   * the publish ceremony, so no bottom-action input reads this.
   * Shape mirrors `selectVersionEvalState` (single derivation).
   */
  evalState?: { running: boolean; latest: { decision: 'PASS' | 'WARN' | 'BLOCK'; stale: boolean; shadow: boolean } | null; hasShadowRuns: boolean; lastFailed: boolean; hasRuns: boolean } | undefined;
  /**
   * Ship readiness for the ship-spine grade (C14). Undefined = unknown
   * (pre-C14 `untouched` copy kept as the ghost); present = graded from
   * `usePublishReadiness` (single derivation — the projector never
   * re-derives gates). Usability signal only — publish executes from the
   * Ship section, so no bottom-action input reads this.
   */
  shipReadiness?: { verdict: 'go' | 'conditional-go' | 'no-go' | 'unknown'; blockers: number; checking: boolean } | undefined;
}

/** Minimal health-pin shape for usability math (superset-compatible). */
export interface HealthPin {
  sourceSlug: string;
  resolved: boolean;
  state: string | null;
  embeddingComplete: boolean | null;
}

// ─── Canonical slot layout (BUILD_PLAN.md §13: constant topology, no ELK) ───

const NODE_W = 240;
const SPINE_X = 0;
const LEFT_X = -340;
const RIGHT_X = 340;
const SPINE_GAP = 150;
const STACK_GAP = 150;

function spineDefaults(): Record<SpineId, { x: number; y: number }> {
  const out = {} as Record<SpineId, { x: number; y: number }>;
  SPINE_IDS.forEach((id, i) => {
    out[id] = { x: SPINE_X, y: i * SPINE_GAP };
  });
  return out;
}

/** Left column stacks knowledge-likes, right column the rest; customs append. */
function columnFor(kind: SlotKind | null, index: number): 'left' | 'right' {
  if (kind === 'knowledge' || kind === 'memory' || kind === 'brand') return 'left';
  if (kind === null) return index % 2 === 0 ? 'right' : 'left';
  return 'right';
}

// ─── Status derivation (per-slot truth tables) ─────────────────────────────

function isSkipped(slotKey: string, kind: SlotKind | null, status: SlotStatus, skippedIds: string[]): boolean {
  if (!skippedIds.includes(slotKey)) return false;
  // Skip evaporates the moment real configuration lands (BUILD_PLAN.md §G).
  if (status === 'ready' || status === 'attention' || status === 'error') return false;
  if (kind !== null && !SKIPPABLE_KINDS.has(kind)) return false;
  return status === 'untouched' || status === 'info';
}

export function brainSubtitle(
  definition: ConsumerDefinition | null,
  modelLabel: (ref: string) => string,
): string | null {
  if (!definition) return null;
  const allowed = definition.model_policy.allowed_models;
  if (allowed.length === 0) return null;
  const first = modelLabel(allowed[0]);
  const rest = allowed.length > 1 ? ` +${allowed.length - 1}` : '';
  const fallback = definition.model_policy.fallback_enabled ? ' · fallback on' : '';
  return `${first}${rest}${fallback}`;
}

export function contextSubtitle(definition: ConsumerDefinition | null): string | null {
  if (!definition) return null;
  const scope = definition.context_policy.memory_scope;
  const scopeLabel = scope === 'org' ? 'org' : scope;
  return `History ${definition.context_policy.history_limit} · ${scopeLabel} · k=${definition.knowledge_policy.max_results}`;
}

/**
 * Knowledge usability grade (C05) — readiness, not presence. Draft pins ×
 * library mapping × ACTIVE-version health:
 * - no pins: ready + stated (retrieval off = deliberate; on-but-empty = named);
 * - pins, health loading: info (neutral, never a false green);
 * - unresolved / failed / coverage-incomplete: attention with reason→fix;
 * - health-silent pins (not in the ACTIVE snapshot — new pins, no live
 *   version): library mapping only, coverage honestly deferred to publish;
 * - all pins resolved + covered: ready.
 */
export interface KnowledgeSlotGrade {
  subtitle: string;
  hint: string;
  status: SlotStatus;
}

export function knowledgeSlot(
  definition: ConsumerDefinition,
  librarySlugs: string[] | null,
  health: { degraded: boolean; pins: HealthPin[] } | null | undefined,
): KnowledgeSlotGrade {
  const pins = definition.context_policy.knowledge_sources;
  const retrieval = definition.knowledge_policy?.retrieval_enabled ?? false;
  if (pins.length === 0) {
    return retrieval
      ? {
        subtitle: 'Retrieval on · no pins',
        hint: 'Retrieval is on but nothing is pinned — answers will not ground.',
        status: 'ready',
      }
      : {
        subtitle: 'Retrieval off — deliberate',
        hint: 'Knowledge is optional. Skipped is not broken.',
        status: 'ready',
      };
  }
  const mapped = librarySlugs === null ? null : pins.filter((s) => librarySlugs.includes(s)).length;
  if (health === undefined || health === null) {
    return {
      subtitle: mapped === null ? `${pins.length} pinned · resolving…` : `${mapped} of ${pins.length} mapped · checking…`,
      hint: health === null ? 'No live version — coverage resolves at first publish.' : 'Pin health still loading — no verdict claimed.',
      status: 'info',
    };
  }
  let silent = 0;
  for (const slug of pins) {
    const hit = health.pins.find((p) => p.sourceSlug === slug);
    if (hit) {
      if (!hit.resolved) {
        return {
          subtitle: `Unresolved pin ${slug} — publish refuses`,
          hint: 'Fix the slug mapping, or acknowledge degraded knowledge at publish.',
          status: 'attention',
        };
      }
      if (hit.state === 'failed') {
        return {
          subtitle: `Pin ${slug} failed ingestion`,
          hint: 'No retry exists — upload a replacement.',
          status: 'attention',
        };
      }
      if (hit.embeddingComplete === false) {
        return {
          subtitle: `Pin ${slug} coverage-incomplete`,
          hint: 'Publish will ask for the degraded-knowledge ack.',
          status: 'attention',
        };
      }
    } else if (librarySlugs !== null && !librarySlugs.includes(slug)) {
      return {
        subtitle: `Unresolved pin ${slug} — publish refuses`,
        hint: 'Fix the slug mapping, or acknowledge degraded knowledge at publish.',
        status: 'attention',
      };
    } else {
      silent += 1;
    }
  }
  if (silent > 0 || mapped === null) {
    return {
      subtitle:
        mapped === null ? `${pins.length} pinned · resolving…` : `${mapped} of ${pins.length} mapped · coverage at publish`,
      hint:
        mapped === null
          ? 'Library still loading.'
          : 'New pins resolve to exact versions at publish — coverage checks then.',
      status: 'info',
    };
  }
  return {
    subtitle: `${mapped} of ${pins.length} mapped · covered`,
    hint: 'All pins resolved and covered for the model.',
    status: 'ready',
  };
}

/**
 * Tools usability grade (C06) — readiness, not presence. Draft entries ×
 * catalog rows × hash pins:
 * - no entries: ready + stated (tools are optional);
 * - catalog loading: info (neutral, never a false green);
 * - missing/disabled/stale: attention with reason→fix (publish refuses);
 * - unpinned rows: info lint (legal, drift-on-arrival);
 * - all entries pinned-fresh or built-in: ready.
 */
export interface ToolCatalogRow {
  name: string;
  hash: string | null;
  version: string | null;
  enabled: boolean | null;
}

export interface ToolsSlotGrade {
  subtitle: string;
  hint: string;
  status: SlotStatus;
}

export function toolsSlot(
  entries: readonly { name: string; schema_hash?: string }[],
  catalog: readonly ToolCatalogRow[] | undefined,
  builtins: readonly string[],
): ToolsSlotGrade {
  if (entries.length === 0) {
    return {
      subtitle: 'No tools — deliberate',
      hint: 'Tools are optional. Skipped is not broken.',
      status: 'ready',
    };
  }
  if (catalog === undefined) {
    return {
      subtitle: `${entries.length} bound · checking…`,
      hint: 'Catalog still loading — no verdict claimed.',
      status: 'info',
    };
  }
  const byName = new Map(catalog.map((row) => [row.name, row]));
  let unpinned = 0;
  for (const entry of entries) {
    if ((builtins as readonly string[]).includes(entry.name)) continue;
    const row = byName.get(entry.name);
    if (!row) {
      return {
        subtitle: `Unbound ${entry.name} — publish refuses`,
        hint: 'Not in the catalog or built-ins — bind from the catalog or unbind it.',
        status: 'attention',
      };
    }
    if (row.enabled === false) {
      return {
        subtitle: `Disabled row ${entry.name} — publish refuses`,
        hint: 'The catalog row is disabled — enable it in the Tools library or unbind it.',
        status: 'attention',
      };
    }
    if (entry.schema_hash !== undefined && row.hash !== null && entry.schema_hash.toLowerCase() !== row.hash.toLowerCase()) {
      return {
        subtitle: `Stale pin ${entry.name} — publish refuses`,
        hint: `Catalog is at v${row.version ?? 'unknown'} — re-pin to the live hash.`,
        status: 'attention',
      };
    }
    if (entry.schema_hash === undefined) unpinned += 1;
  }
  if (unpinned > 0) {
    return {
      subtitle: `${entries.length} bound · ${unpinned} unpinned`,
      hint: 'Unpinned rows are legal, but the next catalog change drifts them silently. Pin them.',
      status: 'info',
    };
  }
  return {
    subtitle: `${entries.length} bound · covered`,
    hint: 'All entries pinned fresh or built-in.',
    status: 'ready',
  };
}

// ─── Projection ────────────────────────────────────────────────────────────

export interface ProjectedGraph {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
}

export function projectBuilderGraph(input: ProjectorInput): ProjectedGraph {
  const { mode, definition, satellites, positions, selectedId, skippedIds } = input;
  const locked = mode === 'new';
  const nodes: BuilderNode[] = [];
  const edges: BuilderEdge[] = [];
  const spinePos = spineDefaults();
  const at = (key: string, fallback: { x: number; y: number }) => positions[key] ?? fallback;

  const push = (
    id: string,
    data: {
      slotKey: string;
      nodeType: 'spine' | 'satellite' | 'empty';
      kind: SlotKind | null;
      title: string;
      subtitle: string | null;
      hint: string | null;
      status: SlotStatus;
      lock: boolean;
      portColor: string | null;
    },
    position: { x: number; y: number },
  ) => {
    const status: SlotStatus = isSkipped(id, data.kind, data.status, skippedIds) ? 'skipped' : data.status;
    nodes.push({
      id,
      type: 'slot',
      position: at(id, position),
      selectable: true,
      draggable: true,
      data: { ...data, status, selected: selectedId === id },
    });
  };

  // — Spine —
  // Brain readiness is usability, not presence (C04): an allowed set with zero
  // usable models is attention-graded — publish refuses it. A still-loading
  // catalog claims nothing (info, neutral) — never a false green.
  const allowedModels = definition?.model_policy.allowed_models ?? [];
  const usableModels = usableRefs(allowedModels, input.models);
  const brainReady = usableModels.length > 0;
  const brainBlocker = allowedModels.length > 0 && usableModels.length === 0 && input.models !== undefined
    ? firstBlocker(allowedModels, input.models)
    : null;
  const brainChecking = allowedModels.length > 0 && usableModels.length === 0 && input.models === undefined;
  const pinCount = definition?.context_policy.knowledge_sources.length ?? 0;
  // Purpose carries identity AND instructions (C02): a draft without instructions
  // is attention-graded — publish refuses it, so the circuit says so early.
  // Subtitle carries payload truth (chars that ship · rules that bind).
  const instructionsText = definition?.instructions ?? '';
  const instructionsEmpty = definition !== null && instructionsText.trim() === '';
  const purposeRules = instructionsEmpty
    ? 0
    : parseInstructions(instructionsText).filter((b) => b.type === 'rule').length;

  push(
    'purpose',
    {
      slotKey: 'purpose',
      nodeType: 'spine',
      kind: null,
      title: SPINE_META.purpose.label,
      subtitle: locked
        ? 'Name your agent to begin'
        : !definition
          ? (input.assistantName ?? SPINE_META.purpose.blurb)
          : instructionsEmpty
            ? (input.assistantName ?? SPINE_META.purpose.blurb)
            : (`${input.assistantName ?? 'Untitled'} · ${instructionsText.length.toLocaleString()} chars · ${purposeRules} rules`),
      hint: definition !== null && instructionsEmpty ? 'Missing — publish refuses' : null,
      status: locked ? 'info' : definition !== null && instructionsEmpty ? 'attention' : 'ready',
      lock: !locked,
      portColor: null,
    },
    spinePos.purpose,
  );

  push(
    'context',
    {
      slotKey: 'context',
      nodeType: 'spine',
      kind: null,
      title: SPINE_META.context.label,
      subtitle: locked ? null : contextSubtitle(definition),
      hint: locked ? 'Create the agent first' : 'Derived from brain + knowledge + memory',
      status: locked ? 'locked' : definition ? (brainReady ? 'ready' : 'untouched') : 'untouched',
      lock: false,
      portColor: null,
    },
    spinePos.context,
  );

  push(
    'brain',
    {
      slotKey: 'brain',
      nodeType: 'spine',
      kind: null,
      title: SPINE_META.brain.label,
      subtitle: locked
        ? null
        : allowedModels.length === 0
          ? null
          : brainChecking
            ? 'Checking catalog…'
            : brainBlocker
              ? (brainBlocker.reason === null
                ? 'Unknown model — publish refuses'
                : `No usable model — ${reasonFix(brainBlocker.reason).label}`)
              : brainSubtitle(definition, input.modelLabel),
      hint: locked
        ? 'Create the agent first'
        : allowedModels.length === 0
          ? 'No model yet — pick one below'
          : brainChecking
            ? 'Catalog still loading'
            : brainBlocker
              ? (brainBlocker.reason === null ? 'Not in the catalog' : `unusable: ${brainBlocker.reason}`)
              : null,
      status: locked
        ? 'locked'
        : brainReady
          ? 'ready'
          : brainChecking
            ? 'info'
            : brainBlocker
              ? 'attention'
              : 'untouched',
      lock: false,
      portColor: null,
    },
    spinePos.brain,
  );

  // Response spine (C13): graded from try state when known, placeholder
  // otherwise. Usability only — try never gates publish.
  const responseGrade = !locked && input.tryState ? gradeResponse({ ...input.tryState, nowMs: Date.now() }) : null;
  push(
    'response',
    {
      slotKey: 'response',
      nodeType: 'spine',
      kind: null,
      title: SPINE_META.response.label,
      subtitle: responseGrade?.subtitle ?? null,
      hint: locked ? 'Create the agent first' : (responseGrade?.hint ?? 'Not tried yet — Try lands in C13'),
      status: locked ? 'locked' : (responseGrade?.status ?? 'untouched'),
      lock: false,
      portColor: null,
    },
    spinePos.response,
  );

  // Ship spine (C14): graded from publish readiness when known,
  // pre-C14 ghost otherwise. Signal only — publish executes in the section.
  const shipGrade = !locked && input.shipReadiness ? gradeShip({ locked: false, readiness: input.shipReadiness }) : null;
  push(
    'ship',
    {
      slotKey: 'ship',
      nodeType: 'spine',
      kind: null,
      title: SPINE_META.ship.label,
      subtitle: shipGrade?.subtitle ?? null,
      hint: locked ? 'Create the agent first' : (shipGrade?.hint ?? 'Publish gates land in C14'),
      status: locked ? 'locked' : (shipGrade?.status ?? 'untouched'),
      lock: false,
      portColor: null,
    },
    spinePos.ship,
  );

  // Spine chain edges (always structural; lit only where data actually flows —
  // nothing flows without a draft, so a version-less scaffold stays dim).
  const chain: SpineId[] = [...SPINE_IDS];
  for (let i = 0; i < chain.length - 1; i += 1) {
    const from = nodes.find((n) => n.id === chain[i]);
    edges.push({
      id: `e:${chain[i]}:${chain[i + 1]}`,
      source: chain[i],
      target: chain[i + 1],
      type: 'data',
      data: {
        variant: 'flow',
        lit: !locked && !!definition && (from?.data.status === 'ready' || from?.data.status === 'info'),
      },
    });
  }

  // — Satellites (column flow; customs append per side) —
  const cursors = { left: 2 * SPINE_GAP, right: SPINE_GAP };
  satellites.forEach((sat, index) => {
    const side = columnFor(sat.kind, index);
    const y = cursors[side];
    cursors[side] += STACK_GAP;
    const x = side === 'left' ? LEFT_X : RIGHT_X;

    if (sat.kind === null) {
      push(
        sat.id,
        {
          slotKey: sat.id,
          nodeType: 'empty',
          kind: null,
          title: 'New component',
          subtitle: null,
          hint: locked ? 'Create the agent first' : 'Choose a type — ⇧K · T · G · B · E · ⇧M · S',
          status: locked ? 'locked' : 'untouched',
          lock: false,
          portColor: null,
        },
        { x, y },
      );
      return;
    }

    const meta = KIND_META[sat.kind];
    let subtitle: string | null = null;
    let hint = 'Not configured';
    let status: SlotStatus = locked ? 'locked' : 'untouched';
    if (!locked && definition) {
      switch (sat.kind) {
        case 'knowledge': {
          const grade = knowledgeSlot(definition, input.librarySlugs, input.knowledgeHealth);
          subtitle = grade.subtitle;
          hint = grade.hint;
          status = grade.status;
          break;
        }
        case 'tools': {
          const grade = toolsSlot(definition.tools, input.toolCatalog, input.toolBuiltins ?? []);
          subtitle = grade.subtitle;
          hint = grade.hint;
          status = grade.status;
          break;
        }
        case 'memory': {
          const grade = gradeMemory({
            memory_scope: parseMemoryScope(definition.context_policy.memory_scope),
            history_limit: definition.context_policy.history_limit,
          });
          subtitle = grade.subtitle;
          hint = grade.hint === '' ? 'Memory policy is set — scope decides what surfaces.' : grade.hint;
          status = grade.status;
          break;
        }
        case 'guardrails': {
          const grade = gradeGuardrails({
            input_policy: definition.guardrails.input_policy,
            output_policy: definition.guardrails.output_policy,
            pii_redaction: definition.guardrails.pii_redaction,
            execution_mode: parseGuardrailMode(definition.guardrails.execution_mode),
          });
          subtitle = grade.subtitle;
          hint = grade.hint === '' ? 'Policy is set — verdicts enforce at run time.' : grade.hint;
          status = grade.status;
          break;
        }
        case 'evaluation': {
          // Gate SIGNAL, not a gate (PLAN.md §6): graded from eval state
          // when known, ghost otherwise. This branch runs only with a
          // definition open, which implies a runnable version row.
          if (input.evalState) {
            const grade = gradeEvaluation({
              hasRunnableVersion: true,
              running: input.evalState.running,
              latest: input.evalState.latest,
              hasShadowRuns: input.evalState.hasShadowRuns,
              lastFailed: input.evalState.lastFailed,
              hasRuns: input.evalState.hasRuns,
            });
            subtitle = grade.subtitle;
            hint = grade.hint;
            status = grade.status;
          } else {
            hint = 'Datasets land in C10';
          }
          break;
        }
        case 'brand': {
          // Born-ready pattern (guardrails/memory precedent): an empty brand
          // is the VALID platform-default state — never red, never ghosted
          // once a draft exists to carry it.
          const voice = (definition.brand || '').trim();
          if (voice === '') {
            subtitle = 'Platform default';
          } else {
            subtitle = `${voice.length.toLocaleString()} chars`;
          }
          status = 'ready';
          break;
        }
        case 'budget': {
          // No costs read in the shell (the section/panel price estimates where
          // costs are loaded) — the satellite grades caps only, never $0-fakes.
          const grade = gradeBudget(definition.budget, null);
          subtitle = grade.subtitle;
          hint = 'Caps stop runs closed — estimates live in the Budget slot.';
          status = grade.status;
          break;
        }
      }
    } else if (!locked && !definition) {
      if (sat.kind === 'guardrails' || sat.kind === 'budget') {
        subtitle = 'Platform defaults';
        status = 'ready';
      }
    }

    push(
      sat.id,
      {
        slotKey: sat.id,
        nodeType: 'satellite',
        kind: sat.kind,
        title: meta.label,
        subtitle,
        hint,
        status,
        lock: false,
        portColor: meta.color,
      },
      { x, y },
    );

    // Derived runtime legs (BUILD_PLAN.md §5) — dim until the endpoint carries data.
    // Brand rides the context leg (voice feeds assembly); like guardrails
    // defaults it flows whenever a draft exists to carry it. The evaluation
    // verdict leg lights on a fresh PASS only (C10 signal, never a gate).
    const legTarget = sat.kind === 'knowledge' || sat.kind === 'memory' || sat.kind === 'brand' ? 'context' : 'brain';
    const evalFreshPass =
      sat.kind === 'evaluation' &&
      input.evalState?.latest !== null &&
      input.evalState?.latest !== undefined &&
      input.evalState.latest.decision === 'PASS' &&
      !input.evalState.latest.stale &&
      !input.evalState.latest.shadow;
    const lit =
      !locked &&
      !!definition &&
      (sat.kind === 'knowledge'
        ? pinCount > 0
        : sat.kind === 'tools'
          ? definition.tools.length > 0
          : sat.kind === 'memory'
            ? definition.context_policy.memory_scope !== 'none'
            : sat.kind === 'guardrails' || sat.kind === 'brand'
              ? true
              : sat.kind === 'evaluation'
                ? evalFreshPass
                : false);
    edges.push({
      id: `e:${sat.id}:${legTarget}`,
      source: sat.id,
      target: legTarget,
      type: 'data',
      data: {
        variant: sat.kind === 'guardrails' ? 'inhibit' : sat.kind === 'evaluation' ? 'verdict' : 'flow',
        lit,
      },
    });
  });

  return { nodes, edges };
}

/** Node footprint estimate (layout math only — React Flow measures the real boxes). */
export const ESTIMATED_NODE_SIZE = { w: NODE_W, h: 96 };
