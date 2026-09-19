/**
 * Builder slot model (BUILD_PLAN.md §4 + §1b + §7b) — the closed vocabulary
 * every builder surface reads. No React, no I/O except the explicitly
 * non-authoritative UI-state helpers (positions/skips/view-set persist to
 * localStorage per agent; cosmetic resets acceptable, data loss impossible —
 * the draft is the only contract truth).
 *
 * Three load-bearing rules (§4):
 *  1. Singleton binding — one satellite per kind; bound kinds focus, never duplicate.
 *  2. Mandatory while configured — bound-to-live-config satellites cannot be
 *     deleted or re-typed (the canvas must never hide runtime truth).
 *  3. Rail is the canonical inventory — canvas is the working set.
 */

export type SlotKind = 'knowledge' | 'tools' | 'memory' | 'guardrails' | 'evaluation' | 'brand' | 'budget';

export type SpineId = 'purpose' | 'context' | 'brain' | 'response' | 'ship';

/** Closed status vocabulary (BUILD_PLAN.md §3) + the two honest pre-states. */
export type SlotStatus =
  | 'locked'
  | 'untouched'
  | 'skipped'
  | 'ready'
  | 'attention'
  | 'info'
  | 'error';

export interface KindMeta {
  kind: SlotKind;
  label: string;
  blurb: string;
  /** Dock-port color (Blender socket lineage, §1b). */
  color: string;
  /** Canvas shortcut that summons this kind (closed map, §7b). */
  shortcut: string;
  /** Component pass that lights the slot (honest placeholders cite this). */
  pass: string;
}

export const KIND_ORDER: readonly SlotKind[] = ['knowledge', 'tools', 'memory', 'guardrails', 'evaluation', 'brand', 'budget'];

export const KIND_META: Record<SlotKind, KindMeta> = {
  knowledge: {
    kind: 'knowledge',
    label: 'Knowledge',
    blurb: 'Documents this agent may retrieve',
    color: '#0A84FF',
    shortcut: '⇧K',
    pass: 'C05',
  },
  tools: {
    kind: 'tools',
    label: 'Tools',
    blurb: 'Capabilities this agent may call',
    color: '#A78BFA',
    shortcut: 'T',
    pass: 'C06',
  },
  memory: {
    kind: 'memory',
    label: 'Memory',
    blurb: 'What this agent remembers',
    color: '#FF9F0A',
    shortcut: '⇧M',
    pass: 'C08',
  },
  guardrails: {
    kind: 'guardrails',
    label: 'Guardrails',
    blurb: 'What this agent may never do',
    color: '#FF9F0A',
    shortcut: 'G',
    pass: 'C07',
  },
  evaluation: {
    kind: 'evaluation',
    label: 'Evaluator',
    blurb: 'Proof this agent behaves',
    color: '#30D158',
    shortcut: 'E',
    pass: 'C10',
  },
  brand: {
    kind: 'brand',
    label: 'Brand',
    blurb: 'How every reply sounds',
    color: '#d8b4fe',
    shortcut: 'B',
    pass: 'C03',
  },
  budget: {
    kind: 'budget',
    label: 'Budget',
    blurb: 'Cost and time guardrails',
    color: '#64D2FF',
    shortcut: 'S',
    pass: 'C09',
  },
};

/** Kinds the maker may explicitly dismiss (Skip for now — §F/G). Brand is NOT
 *  skippable: the platform default applies regardless, so a skip would be a lie. */
export const SKIPPABLE_KINDS: ReadonlySet<SlotKind> = new Set(['knowledge', 'tools', 'memory', 'evaluation']);

export const SPINE_IDS: readonly SpineId[] = ['purpose', 'context', 'brain', 'response', 'ship'];

export const SPINE_META: Record<SpineId, { label: string; blurb: string }> = {
  purpose: { label: 'Purpose', blurb: 'Role, task, rules' },
  context: { label: 'Context', blurb: 'History · scope · summary' },
  brain: { label: 'Brain', blurb: 'Model policy' },
  response: { label: 'Response', blurb: 'Try it before you ship it' },
  ship: { label: 'Ship', blurb: 'Gates, then publish' },
};

/** A satellite view: `{id, kind | null}` — null-kind cards ARE the type picker (§4). */
export interface SatelliteView {
  id: string;
  kind: SlotKind | null;
}

/** Default working set: the five kinds bound but empty (ghosts until configured),
 *  plus one empty card so the type picker is discoverable from the first paint
 *  (the reference shows it open — the card is the picker). Deleting it persists;
 *  the rail/palette re-summon on demand. */
export function defaultSatellites(): SatelliteView[] {
  return [...KIND_ORDER.map((kind) => ({ id: `sat:${kind}`, kind })), { id: 'sat:new', kind: null }];
}

/** Stable id for ad-hoc empty cards (no crypto dependency — jsdom-safe). */
export function newSatelliteId(): string {
  return `sat:custom:${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Engine Room anchor map (BUILD_PLAN.md §K) — builder step → editor section id.
 * The ids land with their component passes; until then Room links use the
 * plain edit path (this map documents intent, nothing reads it yet).
 */
export const BUILDER_STEP_ANCHORS: Record<string, string> = {
  purpose: 'identity',
  context: 'context',
  brain: 'model',
  knowledge: 'knowledge',
  tools: 'tools',
  guardrails: 'guardrails',
  memory: 'memory',
  budget: 'budget',
  response: 'try',
  evaluation: 'evaluation',
  ship: 'publish',
};

export function buildAgentBuildPath(agentId: string): string {
  return `/agent-studio/agents/${agentId}/build`;
}

/**
 * C15 re-entry (?slot=): resolve a requested slot to a selectable node id.
 * Spine ids always resolve; satellite kinds resolve only when bound (an
 * unbound kind is null — the caller falls through to default selection,
 * never a surprise card). Unknown values are null, never an error.
 */
export function resolveInitialSlot(
  slot: string | null | undefined,
  satellites: Array<{ id: string; kind: string | null }>,
): string | null {
  if (!slot) {
    return null;
  }
  if ((SPINE_IDS as readonly string[]).includes(slot)) {
    return slot;
  }
  return satellites.find((s) => s.kind === slot)?.id ?? null;
}

export function buildAgentEditPath(agentId: string): string {
  return `/agent-studio/agents/${agentId}/edit`;
}

export function buildAgentDetailPath(agentId: string): string {
  return `/agent-studio/agents/${agentId}`;
}

// ─── Non-authoritative UI state (window-guarded, try/caught) ────────────────

function storageKey(agentId: string, scope: string): string {
  return `neryva.builder.${agentId}.${scope}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // UI state must never break the builder (private mode, quota, SSR).
  }
}

export function readSkipped(agentId: string): string[] {
  const list = readJson<unknown>(storageKey(agentId, 'skipped'), []);
  return Array.isArray(list) ? list.filter((v): v is string => typeof v === 'string') : [];
}

export function writeSkipped(agentId: string, skipped: string[]): void {
  writeJson(storageKey(agentId, 'skipped'), skipped);
}

export function readPositions(agentId: string): Record<string, { x: number; y: number }> {
  const record = readJson<unknown>(storageKey(agentId, 'positions'), {});
  if (typeof record !== 'object' || record === null) return {};
  const out: Record<string, { x: number; y: number }> = {};
  for (const [key, value] of Object.entries(record as Record<string, unknown>)) {
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { x?: unknown }).x === 'number' &&
      typeof (value as { y?: unknown }).y === 'number'
    ) {
      out[key] = { x: (value as { x: number }).x, y: (value as { y: number }).y };
    }
  }
  return out;
}

export function writePositions(agentId: string, positions: Record<string, { x: number; y: number }>): void {
  writeJson(storageKey(agentId, 'positions'), positions);
}

export function clearPositions(agentId: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(storageKey(agentId, 'positions'));
  } catch {
    // Covered above — UI state never breaks the builder.
  }
}

export function readSatellites(agentId: string): SatelliteView[] | null {
  const list = readJson<unknown>(storageKey(agentId, 'satellites'), null);
  if (!Array.isArray(list)) return null;
  const views: SatelliteView[] = [];
  for (const entry of list) {
    if (typeof entry !== 'object' || entry === null) continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== 'string') continue;
    const kind =
      record.kind === null || (typeof record.kind === 'string' && (KIND_ORDER as readonly string[]).includes(record.kind))
        ? (record.kind as SlotKind | null)
        : null;
    // Persisted garbage degrades to an empty card, never a crash.
    views.push({ id: record.id, kind: typeof record.kind === 'string' && kind === null ? null : kind });
  }
  return views;
}

export function writeSatellites(agentId: string, satellites: SatelliteView[]): void {
  writeJson(storageKey(agentId, 'satellites'), satellites);
}
