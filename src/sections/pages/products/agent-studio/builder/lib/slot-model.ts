/**
 * Builder slot model (BUILD_PLAN.md §4 + §1b + §7b) — the closed vocabulary
 * every builder surface reads. No React, no I/O except the explicitly
 * non-authoritative UI-state helpers (node positions persist to
 * localStorage per agent; cosmetic resets acceptable, data loss impossible —
 * the draft is the only contract truth).
 *
 * v10: the canvas is a FIXED 16-node topology (lane-model.ts) — the
 * satellite working set and skip flags are gone. Closed vocabularies that
 * remain: SlotKind (the seven kind nodes), SpineId, SlotStatus.
 */

import { LANE_NODE_IDS } from './lane-model';

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
    label: 'Evaluation',
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

export const SPINE_IDS: readonly SpineId[] = ['purpose', 'context', 'brain', 'response', 'ship'];

export const SPINE_META: Record<SpineId, { label: string; blurb: string }> = {
  purpose: { label: 'Purpose', blurb: 'Role, task, rules' },
  context: { label: 'Context', blurb: 'History · scope · summary' },
  brain: { label: 'Brain', blurb: 'Model policy' },
  response: { label: 'Response', blurb: 'Try it before you ship it' },
  ship: { label: 'Ship', blurb: 'Gates, then publish' },
};

/**
 * Engine Room anchor map (BUILD_PLAN.md §K) — builder step → editor section id.
 * The ids land with their component passes; until then Room links use the
 * plain edit path (this map documents intent, nothing reads it yet).
 */
export const BUILDER_STEP_ANCHORS: Record<string, string> = {
  purpose: 'identity',
  instructions: 'instructions',
  context: 'context',
  brain: 'model',
  knowledge: 'knowledge',
  tools: 'tools',
  guardrails: 'guardrails',
  memory: 'memory',
  credentials: 'credentials',
  samples: 'samples',
  budget: 'budget',
  response: 'try',
  brand: 'brand',
  try: 'try',
  evaluation: 'evaluation',
  ship: 'publish',
};

export function buildAgentBuildPath(agentId: string): string {
  return `/agent-studio/agents/${agentId}/build`;
}

/**
 * C15 re-entry (?slot=): resolve a requested slot to a selectable node id.
 * The v10 canvas is a fixed 16-node topology (lane-model) — every id in
 * LANE_NODE_IDS resolves; unknown values are null, never an error.
 */
export function resolveInitialSlot(slot: string | null | undefined): string | null {
  if (!slot) {
    return null;
  }
  return (LANE_NODE_IDS as readonly string[]).includes(slot) ? slot : null;
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
