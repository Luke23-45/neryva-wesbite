/**
 * Builder projector (BUILD_PLAN.md §8) — the ONLY function that turns contract
 * truth into canvas truth. Pure: same input → same nodes/edges, which is what
 * makes "no invented states" executable (tests assert ghosts where data is
 * absent). React Flow renders the output; it never derives anything itself.
 *
 * v10: fixed 18-node lane topology (lane-model.ts) — no satellite working
 * set, no empty cards, no column math. Every node has a permanent id; drag
 * positions persist per agent and override the canonical lane coordinates.
 * Statuses a pass hasn't earned yet are never claimed: evaluation with runs
 * is `info` (run truth is the C10 gap). Knowledge earned its grade in C05,
 * tools in C06 (usability from draft entries × catalog rows × pin states).
 */
import type { Edge, Node } from '@xyflow/react';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import {
  KIND_META,
  KIND_ORDER,
  SPINE_IDS,
  SPINE_META,
  type SlotKind,
  type SlotStatus,
  type SpineId,
} from './slot-model';
import { LANE_NODES, LANE_NODE_IDS, laneOf, type LaneId, type LaneNodeId } from './lane-model';
import { UNPINNED_RETRIEVAL_COPY } from './knowledge-model';
import { gradeGuardrails, normalizeDenyTopics, parseGuardrailMode, parsePiiAction, parsePiiEntities, parsePiiSinks } from './guardrails-model';
import { CONTEXT_TOKENS_DEFAULT, gradeMemory, parseMemoryScope } from './memory-model';
import { gradeBudget } from './budget-model';
import { gradeEvaluation } from './eval-model';
import type { VersionEvalState } from './eval-model';
import { gradeShip } from './publish-model';
import { firstBlocker, matchPreset, reasonFix, usableRefs, type CatalogRow } from './brain-model';
import {
  parseRoleTextField,
  roleListHasValue,
  roleTextHasValue,
  type RoleFieldBlock,
} from '@lib/engine/role-fields';

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
  /** Purpose lock glyph — the canvas slot is not editable; rename is the inspector edit affordance → PATCH :assistantId. */
  lock: boolean;
  /** The node's own flat color (C1) — icon tiles, palette rows, canvas minimap. */
  color: string;
  /** Dock-port color (satellites only; null = no port). */
  portColor: string | null;
  /** Lane this node belongs to (v10 — from lane-model, never derived). */
  lane: LaneId;
}

export type BuilderNode = Node<BuilderNodeData>;

export type BuilderEdgeVariant = 'flow' | 'inhibit' | 'verdict';

export interface BuilderEdgeData extends Record<string, unknown> {
  variant: BuilderEdgeVariant;
  lit: boolean;
  /** Dashed semantic-edge label (mockup: "spend cap", "voice & tone") —
   *  present only when the relation is real and named. */
  label?: string;
}

export type BuilderEdge = Edge<BuilderEdgeData>;

export interface ProjectorInput {
  mode: 'new' | 'build';
  assistantName: string | null;
  hasDraft: boolean;
  definition: ConsumerDefinition | null;
  /** Library slugs present (for "n of m mapped" honesty; null = still loading). */
  librarySlugs: string[] | null;
  positions: Record<string, { x: number; y: number }>;
  selectedId: string | null;
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
  evalState?: VersionEvalState | undefined;
  /**
   * Ship readiness for the ship-spine grade (C14). Undefined = unknown
   * (pre-C14 `untouched` copy kept as the ghost); present = graded from
   * `usePublishReadiness` (single derivation — the projector never
   * re-derives gates). Usability signal only — publish executes from the
   * Ship section, so no bottom-action input reads this.
   */
  shipReadiness?: { verdict: 'go' | 'conditional-go' | 'no-go' | 'unknown'; blockers: number; checking: boolean } | undefined;
  /**
   * Provider-credential summary (from useProviderCredentials — the same cached
   * read the CredentialsPanel owns, never a second fetch). Undefined = not
   * readable yet (role gating or still loading — neutral, never invented).
   * `expired` is 0 by construction: the engine exposes no credential-expiry
   * field (ProviderCredential carries revokedAt/compromised only), so no
   * expiry is ever claimed.
   */
  credentialsSummary?: { count: number; expired: number } | undefined;
  /**
   * Samples summary. Undefined = ungradable: the samples gallery has no
   * "configured" count in the contract (inserts are append-only instruction
   * blocks, not a tracked collection) — counting gallery cards would invent
   * agent state. The node renders info, the edge draws dim.
   */
  samplesSummary?: { count: number } | undefined;
}

/** Minimal health-pin shape for usability math (superset-compatible). */
export interface HealthPin {
  sourceSlug: string;
  resolved: boolean;
  state: string | null;
  embeddingComplete: boolean | null;
}

// ─── Status derivation (per-slot truth tables) ─────────────────────────────

export function modelSubtitle(
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

/**
 * Brain node subtitle — payload truth for the slimmed Brain (reasoning
 * profiles only). The matched preset name renders; unset params render
 * nothing (defaults are valid, never a guess).
 */
export function brainSubtitle(definition: ConsumerDefinition | null): string | null {
  if (!definition) return null;
  const matched = matchPreset({
    temperature: definition.model_params.temperature,
    top_p: definition.model_params.top_p,
    max_output_tokens: definition.model_params.max_output_tokens,
    reasoning_effort: definition.model_params.reasoning_effort,
  });
  return matched ? matched.label : null;
}

export function contextSubtitle(definition: ConsumerDefinition | null): string | null {
  if (!definition) return null;
  const scope = definition.context_policy.memory_scope;
  const scopeLabel = scope === 'org' ? 'org' : scope;
  return `History ${definition.context_policy.history_limit} · ${scopeLabel} · k=${definition.knowledge_policy.max_results}`;
}

/**
 * Response node subtitle — payload truth with engine defaults applied
 * (absent policy = markdown, citations on, streaming auto).
 */
export function responseSubtitle(definition: ConsumerDefinition | null): string | null {
  if (!definition) return null;
  const policy = definition.response_policy;
  // Missing members read as the engine defaults — a partial policy never
  // renders the wrong format or "citations off" (absent = markdown, on, auto).
  const format = policy?.output_format === 'plain' ? 'Plain text' : 'Markdown';
  const citations = policy?.citations_enabled === false ? 'off' : 'on';
  const streaming = policy?.streaming ?? 'auto';
  return `${format} · citations ${citations} · streaming ${streaming}`;
}

/**
 * Role section subtitle — payload truth (D-N2). Absent role renders
 * nothing (no persona is valid and the default). A set role shows the role
 * name plus how many of the other five fields are filled (parsed values,
 * not raw block text — mode is not content).
 */
export function roleSubtitle(definition: ConsumerDefinition | null): string | null {
  if (!definition) return null;
  const role = definition.role;
  if (!role) return null;
  const name = parseRoleTextFieldSafe(role.role);
  const extras =
    (roleTextHasValue(role.goal) ? 1 : 0) +
    (roleListHasValue(role.traits) ? 1 : 0) +
    (roleTextHasValue(role.communicationStyle) ? 1 : 0) +
    (roleListHasValue(role.knowledgeAreas) ? 1 : 0) +
    (roleListHasValue(role.prohibitedTopics) ? 1 : 0);
  if (!name && extras === 0) return null;
  const shown = name && name.length > 42 ? `${name.slice(0, 42)}…` : name;
  if (!shown) return extras === 1 ? 'Persona · 1 field set' : `Persona · ${extras} fields set`;
  return extras > 0 ? `${shown} · +${extras} more` : shown;
}

/** Parsed role text, or null when blank/unparseable (read-side honesty). */
function parseRoleTextFieldSafe(block: RoleFieldBlock | undefined): string | null {
  if (!block) return null;
  const parsed = parseRoleTextField(block);
  if (parsed === undefined || parsed.trim() === '') return null;
  return parsed;
}

/**
 * Honest "user saved this section" predicates — the anti-born-ready rule.
 * A section is `ready` only when the draft carries user-authored content;
 * engine defaults and empty policies grade `untouched`, never `ready`.
 * The defaults below mirror neryva-engine
 * src/modules/assistants/validation.ts (zod .default() values); if the
 * engine changes a default, the predicate here must move with it.
 */

/** Engine default context_policy (validation.ts): history 20, summary on,
 * user scope, 32K token budget.
 * knowledge_sources is deliberately EXCLUDED — the Context section shows pins
 * read-only; the Knowledge section owns them. Counting pins here would mark
 * Context green for work done in Knowledge. */
function contextPolicyIsDefault(definition: ConsumerDefinition): boolean {
  const policy = definition.context_policy;
  return (
    policy.history_limit === 20 &&
    (policy.summary_enabled ?? true) === true &&
    (policy.memory_scope ?? 'user') === 'user' &&
    (policy.max_context_tokens ?? CONTEXT_TOKENS_DEFAULT) === CONTEXT_TOKENS_DEFAULT
  );
}

/** Engine default response_policy (validation.ts): absent/empty = markdown, citations on, streaming auto. */
function responsePolicyIsDefault(definition: ConsumerDefinition): boolean {
  const policy = definition.response_policy;
  if (!policy) return true;
  return (
    (policy.output_format ?? 'markdown') === 'markdown' &&
    (policy.citations_enabled ?? true) === true &&
    (policy.streaming ?? 'auto') === 'auto'
  );
}

/** Memory is untouched when scope and history both read as engine defaults. */
function memoryIsDefault(definition: ConsumerDefinition): boolean {
  const policy = definition.context_policy;
  return (policy.memory_scope ?? 'user') === 'user' && policy.history_limit === 20;
}

/**
 * Knowledge usability grade (C05) — readiness, not presence. Draft pins ×
 * library mapping × ACTIVE-version health:
 * - no pins: untouched (retrieval off = Not configured; on-but-empty = named);
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
        hint: UNPINNED_RETRIEVAL_COPY,
        status: 'untouched',
      }
      : {
        subtitle: 'Not configured',
        hint: 'Knowledge is optional. Pin sources in the Knowledge section to ground answers.',
        status: 'untouched',
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
 * - no entries: untouched + stated (tools are optional);
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
      subtitle: 'Not configured',
      hint: 'Tools are optional. Bind tools in the Tools section to extend the agent.',
      status: 'untouched',
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

// ─── Projection (v10: fixed 18-node lane topology) ──────────────────────────

export interface ProjectedGraph {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
}

/**
 * The 14 functional ids — everything except context/response/role/brain. Health
 * and next-step math read exactly this set (the four own real sections but
 * stay out of readiness math — their defaults are valid without explicit
 * configuration, pending their ship-flow integration). The Model node owns
 * the model-usability grade the Brain node used to carry.
 */
export const FUNCTIONAL_NODE_IDS: readonly LaneNodeId[] = LANE_NODE_IDS.filter(
  (id): id is LaneNodeId => id !== 'context' && id !== 'response' && id !== 'role' && id !== 'brain',
);

export function projectBuilderGraph(input: ProjectorInput): ProjectedGraph {
  const { mode, definition, positions, selectedId } = input;
  const locked = mode === 'new';
  const nodes: BuilderNode[] = [];
  const edges: BuilderEdge[] = [];
  const at = (id: LaneNodeId, fallback: { x: number; y: number }): { x: number; y: number } =>
    positions[id] ?? { x: fallback.x, y: fallback.y };

  const push = (
    id: LaneNodeId,
    data: {
      slotKey: string;
      nodeType: 'spine' | 'satellite' | 'empty';
      kind: SlotKind | null;
      title: string;
      subtitle: string | null;
      hint: string | null;
      status: SlotStatus;
      lock: boolean;
      color: string;
      portColor: string | null;
    },
    position: { x: number; y: number },
  ) => {
    nodes.push({
      id,
      type: 'slot',
      position: at(id, position),
      selectable: true,
      draggable: true,
      data: { ...data, selected: selectedId === id, lane: laneOf(id) },
    });
  };

  // — Identity lane —
  // Purpose is identity ONLY (v10 §8.5): instructions moved to the
  // Instructions node — purpose no longer grades them. Subtitle carries the
  // name, never derived payload. Honest rule: the name is user-authored at
  // creation, so a named agent is ready with or without a draft — an
  // unnamed one is untouched, never born-ready.
  const purposeNamed = (input.assistantName ?? '').trim() !== '';
  push(
    'purpose',
    {
      slotKey: 'purpose',
      nodeType: 'spine',
      kind: null,
      title: LANE_NODES.purpose.label,
      subtitle: locked ? 'Name your agent to begin' : (input.assistantName ?? SPINE_META.purpose.blurb),
      hint: null,
      status: locked ? 'locked' : purposeNamed ? 'ready' : 'untouched',
      lock: !locked,
      color: LANE_NODES.purpose.color,
      portColor: LANE_NODES.purpose.color,
    },
    LANE_NODES.purpose,
  );

  // Instructions (v10 §8.5 — new node): a draft without instructions is
  // attention-graded — publish refuses it, so the circuit says so early.
  // Subtitle carries chars that ship; the rule count was dropped with the
  // heuristic parser — counting rules from compiled text would be a guess.
  const instructionsText = definition?.instructions ?? '';
  const instructionsEmpty = definition === null || instructionsText.trim() === '';
  push(
    'instructions',
    {
      slotKey: 'instructions',
      nodeType: 'spine',
      kind: null,
      title: LANE_NODES.instructions.label,
      subtitle: locked || instructionsEmpty ? null : `${instructionsText.length.toLocaleString()} chars`,
      hint: locked ? 'Create the agent first' : instructionsEmpty ? 'Missing — publish refuses' : null,
      status: locked ? 'locked' : instructionsEmpty ? 'attention' : 'ready',
      lock: false,
      color: LANE_NODES.instructions.color,
      portColor: LANE_NODES.instructions.color,
    },
    LANE_NODES.instructions,
  );

  // — Kind nodes (fixed set, id = kind; grading is the pre-v10 truth) —
  const pinCount = definition?.context_policy.knowledge_sources.length ?? 0;
  const brandVoice = parseRoleTextFieldSafe(definition?.brand);
  const budgetGrade = !locked && definition ? gradeBudget(definition.budget, null) : null;

  for (const kind of KIND_ORDER) {
    const meta = KIND_META[kind];
    let subtitle: string | null = null;
    let hint = 'Not configured';
    let status: SlotStatus = locked ? 'locked' : 'untouched';
    if (!locked && definition) {
      switch (kind) {
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
          // Honest rule: engine-default scope/history is not user content.
          const touched = !memoryIsDefault(definition);
          subtitle = touched ? grade.subtitle : 'Not configured';
          hint = touched
            ? (grade.hint === '' ? 'Memory policy is set — scope decides what surfaces.' : grade.hint)
            : 'Engine defaults apply — set scope or history in the Memory section.';
          status = touched ? grade.status : 'untouched';
          break;
        }
        case 'guardrails': {
          const grade = gradeGuardrails({
            input_policy: definition.guardrails.input_policy,
            output_policy: definition.guardrails.output_policy,
            pii_redaction: definition.guardrails.pii_redaction,
            execution_mode: parseGuardrailMode(definition.guardrails.execution_mode),
            pii_entities: parsePiiEntities(definition.guardrails.pii_entities),
            pii_action: parsePiiAction(definition.guardrails.pii_action),
            pii_applies_to: parsePiiSinks(definition.guardrails.pii_applies_to),
            notify_owner: definition.guardrails.notify_owner === true,
            attach_to_trace: definition.guardrails.attach_to_trace !== false,
            deny_topics: normalizeDenyTopics(definition.guardrails.deny_topics),
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
            hint = 'Datasets attach in the Evaluation section';
          }
          break;
        }
        case 'brand': {
          // Honest rule: an empty brand is untouched — the platform default
          // is engine behavior, not user content, and never earns the mark.
          const touched = brandVoice !== null && brandVoice !== '';
          subtitle = touched && brandVoice ? `${brandVoice.length.toLocaleString()} chars` : 'Platform default';
          hint = touched ? hint : 'No voice set — set one in the Brand section.';
          status = touched ? 'ready' : 'untouched';
          break;
        }
        case 'budget': {
          // No costs read in the shell (the section/panel price estimates where
          // costs are loaded) — the node grades caps only, never $0-fakes.
          // Honest rule: no caps set is untouched, never "Platform defaults".
          subtitle = budgetGrade?.subtitle ?? null;
          hint =
            budgetGrade?.status === 'untouched' && budgetGrade.hint !== ''
              ? budgetGrade.hint
              : 'Caps stop runs closed — estimates live in the Budget slot.';
          status = budgetGrade?.status ?? 'untouched';
          break;
        }
      }
    } else if (!locked && !definition) {
      // No draft, no content: nothing is born-ready. The loop default
      // ('Not configured' / 'untouched') already says it honestly.
    }

    push(
      kind,
      {
        slotKey: kind,
        nodeType: 'satellite',
        kind,
        title: meta.label,
        subtitle,
        hint,
        status,
        lock: false,
        color: meta.color,
        portColor: meta.color,
      },
      LANE_NODES[kind],
    );

    // Derived runtime legs (BUILD_PLAN.md §5) — dim until the endpoint carries data.
    // Brand rides the context leg (voice feeds assembly); the evaluation
    // verdict leg lights on a fresh PASS only (C10 signal, never a gate).
    // Budget has no generic leg — its only model relation is the labeled
    // 'spend cap' edge below (a second e:budget:model would duplicate the id).
    // Legs follow the node's honest status — a leg never lights for an
    // untouched section.
    if (kind === 'budget') continue;
    const legTarget = kind === 'knowledge' || kind === 'memory' || kind === 'brand' ? 'context' : 'model';
    const evalFreshPass =
      kind === 'evaluation' &&
      input.evalState?.latest !== null &&
      input.evalState?.latest !== undefined &&
      input.evalState.latest.decision === 'PASS' &&
      !input.evalState.latest.stale &&
      !input.evalState.latest.shadow;
    const legNode = nodes.find((n) => n.id === kind);
    const lit =
      !locked &&
      !!definition &&
      (kind === 'knowledge'
        ? pinCount > 0
        : kind === 'tools'
          ? definition.tools.length > 0
          : kind === 'memory'
            ? !memoryIsDefault(definition)
            : kind === 'guardrails' || kind === 'brand'
              ? legNode?.data.status === 'ready'
              : kind === 'evaluation'
                ? evalFreshPass
                : false);
    edges.push({
      id: `e:${kind}:${legTarget}`,
      source: kind,
      target: legTarget,
      type: 'data',
      data: {
        variant: kind === 'guardrails' ? 'inhibit' : kind === 'evaluation' ? 'verdict' : 'flow',
        lit,
      },
    });
  }

  // — Cognition lane (model, brain, context, samples) —
  // Model readiness is usability, not presence (C04): an allowed set with zero
  // usable models is attention-graded — publish refuses it. A still-loading
  // catalog claims nothing (info, neutral) — never a false green.
  const allowedModels = definition?.model_policy.allowed_models ?? [];
  const usableModels = usableRefs(allowedModels, input.models);
  const modelReady = usableModels.length > 0;
  const modelBlocker = allowedModels.length > 0 && usableModels.length === 0 && input.models !== undefined
    ? firstBlocker(allowedModels, input.models)
    : null;
  const modelChecking = allowedModels.length > 0 && usableModels.length === 0 && input.models === undefined;
  push(
    'model',
    {
      slotKey: 'model',
      nodeType: 'spine',
      kind: null,
      title: LANE_NODES.model.label,
      subtitle: locked
        ? null
        : allowedModels.length === 0
          ? null
          : modelChecking
            ? 'Checking catalog…'
            : modelBlocker
              ? (modelBlocker.reason === null
                ? 'Unknown model — publish refuses'
                : `No usable model — ${reasonFix(modelBlocker.reason).label}`)
              : modelSubtitle(definition, input.modelLabel),
      hint: locked
        ? 'Create the agent first'
        : allowedModels.length === 0
          ? 'No model yet — pick one below'
          : modelChecking
            ? 'Catalog still loading'
            : modelBlocker
              ? (modelBlocker.reason === null ? 'Not in the catalog' : `unusable: ${modelBlocker.reason}`)
              : null,
      status: locked
        ? 'locked'
        : modelReady
          ? 'ready'
          : modelChecking
            ? 'info'
            : modelBlocker
              ? 'attention'
              : 'untouched',
      lock: false,
      color: LANE_NODES.model.color,
      portColor: LANE_NODES.model.color,
    },
    LANE_NODES.model,
  );

  // Brain is a real section (the Brain node owns the reasoning profiles —
  // Clerk/Scholar/Creator presets that shape how the model thinks). Honest
  // rule: unset params are engine defaults, not user content — the node is
  // ready only when a preset actually matched what the user saved.
  const brainMatched = definition ? brainSubtitle(definition) !== null : false;
  push(
    'brain',
    {
      slotKey: 'brain',
      nodeType: 'spine',
      kind: null,
      title: SPINE_META.brain.label,
      subtitle: locked ? null : (brainSubtitle(definition) ?? 'Not configured'),
      hint:
        locked
          ? 'Create the agent first'
          : brainMatched
            ? null
            : 'No reasoning profile selected — pick one in the Brain section.',
      status: locked ? 'locked' : brainMatched ? 'ready' : 'untouched',
      lock: false,
      color: LANE_NODES.brain.color,
      portColor: LANE_NODES.brain.color,
    },
    LANE_NODES.brain,
  );

  // Context and Response are real sections (the Context node owns
  // context_policy; the Response node owns response_policy). Subtitles carry
  // payload truth; the two stay out of FUNCTIONAL_NODE_IDS — health and
  // next-step math still read the 14 legacy-functional nodes. Honest rule:
  // all-default policies are engine defaults, not user content.
  const contextTouched = definition ? !contextPolicyIsDefault(definition) : false;
  const responseTouched = definition ? !responsePolicyIsDefault(definition) : false;
  for (const id of ['context', 'response'] as const) {
    const touched = id === 'context' ? contextTouched : responseTouched;
    push(
      id,
      {
        slotKey: id,
        nodeType: 'spine',
        kind: null,
        title: LANE_NODES[id].label,
        subtitle:
          locked || touched
            ? id === 'context'
              ? contextSubtitle(definition)
              : responseSubtitle(definition)
            : 'Not configured',
        hint:
          locked
            ? 'Create the agent first'
            : touched
              ? null
              : `Engine defaults apply — configure them in the ${id === 'context' ? 'Context' : 'Response'} section.`,
        status: locked ? 'locked' : touched ? 'ready' : 'untouched',
        lock: false,
        color: LANE_NODES[id].color,
        portColor: LANE_NODES[id].color,
      },
      LANE_NODES[id],
    );
  }

  // Role is a real section (the Role section owns role — D-N2,
  // structured persona, composed into the system prompt server-side).
  // Subtitle carries payload truth; like context/response it stays out of
  // FUNCTIONAL_NODE_IDS. Honest rule: an empty policy composes no persona
  // block — no persona content means untouched, never born-ready.
  const roleTouched = definition ? roleSubtitle(definition) !== null : false;
  push(
    'role',
    {
      slotKey: 'role',
      nodeType: 'spine',
      kind: null,
      title: LANE_NODES.role.label,
      subtitle: locked ? null : (roleSubtitle(definition) ?? 'Not configured'),
      hint:
        locked
          ? 'Create the agent first'
          : roleTouched
            ? null
            : 'No persona set — define one in the Role section.',
      status: locked ? 'locked' : roleTouched ? 'ready' : 'untouched',
      lock: false,
      color: LANE_NODES.role.color,
      portColor: LANE_NODES.role.color,
    },
    LANE_NODES.role,
  );

  // Samples (v10 §8.7): the gallery has no "configured" count in the
  // contract, so without a summary this is untouched, never an invented
  // number. 'info' would read as "all good" — the honest mark for an
  // ungradable node is 'untouched' (not configured).
  const samples = input.samplesSummary;
  push(
    'samples',
    {
      slotKey: 'samples',
      nodeType: 'satellite',
      kind: null,
      title: LANE_NODES.samples.label,
      subtitle: samples && samples.count > 0 ? `${samples.count} samples` : null,
      hint: locked
        ? 'Create the agent first'
        : !samples
          ? 'Configured in the Samples section'
          : samples.count === 0
            ? 'Add examples to steer replies'
            : null,
      status: locked ? 'locked' : !samples ? 'untouched' : samples.count === 0 ? 'untouched' : 'ready',
      lock: false,
      color: LANE_NODES.samples.color,
      portColor: LANE_NODES.samples.color,
    },
    LANE_NODES.samples,
  );

  // Credentials (v10 §8.7): graded from the cached credential list — the
  // same read the CredentialsPanel owns. The engine exposes no expiry
  // field, so `expired` is 0 by construction and never claims a re-auth.
  const creds = input.credentialsSummary;
  push(
    'credentials',
    {
      slotKey: 'credentials',
      nodeType: 'satellite',
      kind: null,
      title: LANE_NODES.credentials.label,
      subtitle: creds ? `${creds.count} configured` : null,
      hint: locked
        ? 'Create the agent first'
        : !definition
          ? 'Configured in the Credentials section'
          : !creds
            ? 'Configured in the Credentials section'
            : creds.expired > 0
              ? `${creds.expired} expired — re-authenticate`
              : creds.count === 0
                ? 'No provider keys — connect one in the Credentials section'
                : null,
      status: locked
        ? 'locked'
        : !definition
          ? 'untouched'
          : !creds
            ? 'info'
            : creds.expired > 0
              ? 'attention'
              : creds.count === 0
                ? 'untouched'
                : 'ready',
      lock: false,
      color: LANE_NODES.credentials.color,
      portColor: LANE_NODES.credentials.color,
    },
    LANE_NODES.credentials,
  );

  // — Delivery lane —
  // Try (v10 §8.6 — the topbar "Test run" lands here): graded from try state
  // only. No timestamps anywhere (C2/A2) — the run's age is not a grade.
  const tryState = input.tryState;
  push(
    'try',
    {
      slotKey: 'try',
      nodeType: 'satellite',
      kind: null,
      title: LANE_NODES.try.label,
      subtitle: tryState?.lastTryFailed ? 'Last run failed' : tryState?.lastTryAt ? 'Last run ok' : null,
      hint: locked
        ? 'Create the agent first'
        : !tryState?.hasRunnableVersion
          ? 'Save a draft first'
          : tryState.lastTryFailed
            ? 'Open Try for the stop line'
            : tryState.lastTryAt
              ? null
              : 'Not tried yet',
      status: locked
        ? 'locked'
        : !tryState?.hasRunnableVersion
          ? 'locked'
          : tryState.lastTryFailed
            ? 'attention'
            : tryState.lastTryAt
              ? 'ready'
              : 'untouched',
      lock: false,
      color: LANE_NODES.try.color,
      portColor: LANE_NODES.try.color,
    },
    LANE_NODES.try,
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
      hint: locked ? 'Create the agent first' : (shipGrade?.hint ?? 'Publish gates are checked in the Ship section'),
      status: locked ? 'locked' : (shipGrade?.status ?? 'untouched'),
      lock: false,
      color: LANE_NODES.ship.color,
      portColor: LANE_NODES.ship.color,
    },
    LANE_NODES.ship,
  );

  // — Edges —
  // Spine chain (always structural; lit only where data actually flows —
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

  // instructions→model: instructions assemble into the prompt the model runs.
  edges.push({
    id: 'e:instructions:model',
    source: 'instructions',
    target: 'model',
    type: 'data',
    data: { variant: 'flow', lit: !locked && !!definition && !instructionsEmpty },
  });

  // model→brain: the selected model powers the brain's reasoning profiles.
  // Lit when a usable model is picked — the brain has something to run on.
  edges.push({
    id: 'e:model:brain',
    source: 'model',
    target: 'brain',
    type: 'data',
    data: { variant: 'flow', lit: !locked && modelReady },
  });

  // samples→instructions: samples steer the composer. When samples are
  // ungradable the target degrades to model — the edge stays dim either
  // way (no invented steering claimed).
  const samplesTarget: LaneNodeId = samples ? 'instructions' : 'model';
  edges.push({
    id: `e:samples:${samplesTarget}`,
    source: 'samples',
    target: samplesTarget,
    type: 'data',
    data: { variant: 'flow', lit: !locked && (samples?.count ?? 0) > 0 },
  });

  // credentials→tools: BYOK keys are what let bound tools actually run.
  edges.push({
    id: 'e:credentials:tools',
    source: 'credentials',
    target: 'tools',
    type: 'data',
    data: { variant: 'flow', lit: !locked && (creds?.count ?? 0) > 0 },
  });

  // try→response: a try run IS the response preview.
  edges.push({
    id: 'e:try:response',
    source: 'try',
    target: 'response',
    type: 'data',
    data: { variant: 'flow', lit: !locked && !!tryState?.lastTryAt },
  });

  // budget→model 'spend cap' (dashed): caps constrain the model's spend.
  // Lit only when a spend cap is actually set — gradeBudget's return says
  // "Capped" exactly then (caps only, never $0-fakes).
  edges.push({
    id: 'e:budget:model',
    source: 'budget',
    target: 'model',
    type: 'data',
    data: {
      variant: 'verdict',
      lit: !locked && !!definition && (budgetGrade?.subtitle.startsWith('Capped') ?? false),
      label: 'spend cap',
    },
  });

  // brand→response 'voice & tone' (dashed): voice shapes every reply.
  edges.push({
    id: 'e:brand:response',
    source: 'brand',
    target: 'response',
    type: 'data',
    data: {
      variant: 'verdict',
      lit: !locked && !!definition && brandVoice !== null && brandVoice !== '',
      label: 'voice & tone',
    },
  });

  return { nodes, edges };
}

/** Node footprint estimate (layout math only — React Flow measures the real boxes). */
export const ESTIMATED_NODE_SIZE = { w: 200, h: 100 };
