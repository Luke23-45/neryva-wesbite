/**
 * Tools model-policy model (C06 PLAN.md §4) — thin where the engine owns truth,
 * strict where the contract does.
 *
 * Two name rules, two objects (PLAN §8b — never merged):
 * - CATALOG names: ^[a-z][a-z0-9_]{1,63}$ (tool-catalog.service.ts:47,434;
 *   console TOOL_NAME_PATTERN mirrors it — parity asserted by test).
 * - ENTRY names: ^[a-z0-9_]+$ min 2 max 64 (contract; engine matches:
 *   validation.ts min 2 max 64 regex ^[a-z0-9_]+$ — parity asserted by test).
 *
 * Approval display runs through the SINGLE central mapping
 * (agent-payload.effectiveApproval, fixed in this pass per PLAN §8e) with
 * source labels — never a parallel mapping.
 */
import { effectiveApproval, type ConsumerApproval } from '@lib/engine/agent-payload';
import { CAPS } from '@lib/engine/setup-caps';
import { TOOL_NAME_PATTERN } from '@hooks/studio/useSetupTools';

export const TOOLS_MAX = 50;
export const ENTRY_NAME_MIN = 2;
export const ENTRY_NAME_MAX = 64;
export const ENTRY_NAME_PATTERN = /^[a-z0-9_]+$/;
export const SCHEMA_HASH_PATTERN = /^[0-9a-f]{64}$/i;

export type ExecutionMode = 'live' | 'shadow';
export type ApprovalSource = 'entry' | 'catalog' | 'default';

/** Entry-name check — null = shippable. Contract rule, min-2 floor included. */
export function validateToolName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === '') return 'Every tool needs a name.';
  if (trimmed.length < ENTRY_NAME_MIN) {
    return `Tool names run ${ENTRY_NAME_MIN}–${ENTRY_NAME_MAX} characters (currently ${trimmed.length}).`;
  }
  if (trimmed.length > ENTRY_NAME_MAX) {
    return `Tool names must be ≤ ${ENTRY_NAME_MAX} characters.`;
  }
  if (!ENTRY_NAME_PATTERN.test(trimmed)) {
    return 'Lowercase letters, digits, and underscores only — no leading-letter rule.';
  }
  return null;
}

/** Catalog-name check — null = shippable. Engine rule (leading letter REQUIRED). */
export function validateCatalogName(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  if (!TOOL_NAME_PATTERN.test(normalized)) {
    return 'Must match ^[a-z][a-z0-9_]{1,63}$ (letter first, 2–64 chars).';
  }
  return null;
}

export interface ToolEntryInput {
  name: string;
}

export type EntriesCheck = { ok: true; names: string[] } | { ok: false; message: string };

/** Bound-entries gate — engine max 50 (neryva-engine
 * `src/modules/assistants/validation.ts:128-144` `.max(50)`), unique names
 * (exact match: the engine lowercases catalog paths server-side and the entry
 * pattern already forbids case, so exactness is exact). */
export function validateEntries(entries: readonly ToolEntryInput[]): EntriesCheck {
  const names = entries.map((e) => e.name.trim()).filter((n) => n !== '');
  if (names.length > TOOLS_MAX) {
    return { ok: false, message: `At most ${TOOLS_MAX} tools per agent (currently ${names.length}) — unbind one first.` };
  }
  const seen = new Set<string>();
  for (const name of names) {
    const problem = validateToolName(name);
    if (problem) return { ok: false, message: `Tool “${name}” is not a valid entry name — ${problem}` };
    if (seen.has(name)) return { ok: false, message: `Tool “${name}” is bound twice — unbind the duplicate.` };
    seen.add(name);
  }
  return { ok: true, names: [...seen] };
}

/** 50-cap hold for the bind affordance (named, never a silent disable). */
export function canBind(boundCount: number): { ok: true } | { ok: false; message: string } {
  if (boundCount >= TOOLS_MAX) {
    return { ok: false, message: `Tool limit reached (${TOOLS_MAX}) — unbind one to bind another.` };
  }
  return { ok: true };
}

export interface ApprovalVerdict {
  mode: 'required' | 'optional';
  source: ApprovalSource;
}

/**
 * Authorize-time approval mode with its provenance — the central mapping plus
 * source labels (entry = maker asked; catalog = row escalates regardless;
 * default = neither). Display states the source; enforcement needs no display.
 */
export function approvalMode(
  entryApproval: ConsumerApproval,
  catalogRequirement: string | null,
): ApprovalVerdict {
  const mode = effectiveApproval({ approval: entryApproval }, catalogRequirement);
  if (entryApproval === 'always' && mode === 'required') return { mode, source: 'entry' };
  if (catalogRequirement === 'REQUIRED' && mode === 'required') return { mode, source: 'catalog' };
  return { mode: 'optional', source: 'default' };
}

export type PinState =
  | { kind: 'builtin' }
  | { kind: 'ready'; version: string | null }
  | { kind: 'stale'; liveVersion: string | null }
  | { kind: 'missing' }
  | { kind: 'disabled' }
  | { kind: 'unpinned' };

export interface CatalogRowInput {
  hash: string | null;
  version: string | null;
  enabled: boolean | null;
}

/**
 * Hash-pin state per bound entry — publish refuses everything but ready +
 * builtin (typed messages name the fix). Unpinned rows (no entry hash) are
 * legal but drift-on-arrival: lint, never block.
 */
export function pinState(
  entryHash: string | undefined,
  row: CatalogRowInput | null,
  isBuiltIn: boolean,
): PinState {
  if (isBuiltIn) return { kind: 'builtin' };
  if (!row) return { kind: 'missing' };
  if (row.enabled === false) return { kind: 'disabled' };
  if (entryHash === undefined) return { kind: 'unpinned' };
  if (row.hash === null) return { kind: 'ready', version: row.version };
  if (entryHash.toLowerCase() === row.hash.toLowerCase()) return { kind: 'ready', version: row.version };
  return { kind: 'stale', liveVersion: row.version };
}

/** Re-pin target: the live row hash (absent hash = nothing to pin to). */
export function repinHash(row: CatalogRowInput | null): string | null {
  return row?.hash ?? null;
}

export type PerimeterView =
  | { kind: 'builtin' }
  | { kind: 'none'; reason: 'in_process' }
  | { kind: 'egress'; environment: string; domains: string[]; bindingCovered: boolean | null };

/**
 * Perimeter display model — effective environment, never a default claim.
 * Null row (unknown catalog state) degrades to the historical posture with
 * coverage unknown; in_process declares no surface at all.
 */
export function perimeterView(
  row: { executionEnvironment: string | null; allowedEgressDomains: string[] | null; bindingHost: string | null } | null,
  isBuiltIn: boolean,
): PerimeterView {
  if (isBuiltIn) return { kind: 'builtin' };
  if (!row) return { kind: 'egress', environment: 'external_gateway', domains: [], bindingCovered: null };
  if (row.executionEnvironment === 'in_process') return { kind: 'none', reason: 'in_process' };
  const environment = row.executionEnvironment ?? 'external_gateway';
  const domains = row.allowedEgressDomains ?? [];
  const bindingCovered = row.bindingHost === null ? null : domains.includes(row.bindingHost);
  return { kind: 'egress', environment, domains, bindingCovered };
}

/** Bounds-clamped reorder (display + authorize-list order; publish assigns no
 *  priority to tool order — stated in UI, never a fallback fantasy). */
export function moveTool(names: readonly string[], from: number, to: number): string[] {
  if (from < 0 || from >= names.length) return [...names];
  const clamped = Math.min(Math.max(to, 0), names.length - 1);
  if (clamped === from) return [...names];
  const next = [...names];
  const [moved] = next.splice(from, 1);
  next.splice(clamped, 0, moved);
  return next;
}

export function isBuiltinTool(name: string, builtins: readonly string[]): boolean {
  return (builtins as readonly string[]).includes(name);
}

export const UNBIND_COPY = 'Removes the entry. The catalog row stays.';
export const SKIP_COPY = 'Tools are optional. Skipped is not broken.';
export const SHADOW_COPY = 'Shadow — simulated, executes nothing. Measure first, enforce later.';
export const DRIFT_COPY = 'Catalog moved — re-pin to the live hash. Publish refuses stale pins.';
export const APPROVAL_PREVIEW_COPY = 'Calls pause for a human in Approvals — nothing to decide until runtime.';
export const LINT_UNPINNED_COPY = 'No hash pin — legal, but the next catalog change drifts it silently. Pin it.';
export const LINT_EFFECTFUL_COPY = 'Effectful without approval — legal, but every call runs ungated. Require approval?';

/** Contract bounds mirror (single-source drift fails loudly by test). */
export function contractCaps(): { toolsMax: number } {
  return { toolsMax: CAPS.toolsMax };
}

/* ── Tools section redesign: effective approval, effect mix, drift ── */

/**
 * Static effect descriptors for built-in tools (they carry no catalog row,
 * so the row's effectClass is unavailable). Mirrors the engine posture
 * (tool-catalog.service.ts BUILT_IN_TOOLS) and the runtime descriptors
 * (agent-studio/contracts/tool/descriptor.ts DEFAULT_TOOL_DESCRIPTORS):
 * web_search/search_knowledge/search_memory/generate_image are READ_ONLY
 * (generate_image writes no org state — the artifact is claim-checked);
 * request_human_handoff is MUTATING. The frontend groups non-READ_ONLY as
 * "effectful" for the risk counts.
 */
export const BUILTIN_TOOL_EFFECT: Record<string, 'READ_ONLY' | 'EFFECTFUL'> = {
  web_search: 'READ_ONLY',
  request_human_handoff: 'EFFECTFUL',
  generate_image: 'READ_ONLY',
  search_knowledge: 'READ_ONLY',
  search_memory: 'READ_ONLY',
};

/** Static approval requirements for built-ins where the runtime declares one (web_search's NONE). Absent = unknown, never invented. */
export const BUILTIN_TOOL_APPROVAL: Record<string, string> = {
  web_search: 'NONE',
};

/**
 * "Effectful" per the redesign contract: effectClass not in (null,
 * 'READ_ONLY'); built-ins resolve through their static descriptor.
 */
export function isEffectfulTool(effectClass: string | null | undefined, builtinName?: string | null): boolean {
  if (builtinName && BUILTIN_TOOL_EFFECT[builtinName]) {
    return BUILTIN_TOOL_EFFECT[builtinName] === 'EFFECTFUL';
  }
  return effectClass !== null && effectClass !== undefined && effectClass !== 'READ_ONLY';
}

export type EffectiveSource = 'entry' | 'catalog' | 'agent_default' | 'default';

export interface EffectiveApprovalInput {
  entryApproval: ConsumerApproval;
  catalogRequirement: string | null | undefined;
  effectful: boolean;
  agentDefault: 'never' | 'always';
}

/**
 * Effective approval with the redesign precedence — the SINGLE mapping the
 * binary control and every risk count runs through:
 * entry 'always' → catalog REQUIRED → agent default 'always'+effectful → optional.
 *
 * Legacy 'on_effect' is deliberately NOT its own step. The engine wire has no
 * 'on_effect' vocabulary (T-04): the console collapses it to 'optional' on
 * save, the engine's validation accepts only 'required'|'optional', and the
 * runtime enforces the collapsed value. A display step for 'on_effect' would
 * show "gated" for a tool the runtime will run UNGATED after the next save —
 * a silent approval downgrade. So the display treats 'on_effect' as its wire
 * equivalent ('never') and the agent-wide default is the successor mechanism
 * for "effectful tools need approval".
 */
export function effectiveApprovalDetailed(input: EffectiveApprovalInput): {
  mode: 'required' | 'optional';
  source: EffectiveSource;
} {
  if (input.entryApproval === 'always') return { mode: 'required', source: 'entry' };
  if (input.catalogRequirement === 'REQUIRED') return { mode: 'required', source: 'catalog' };
  if (input.agentDefault === 'always' && input.effectful)
    return { mode: 'required', source: 'agent_default' };
  return { mode: 'optional', source: 'default' };
}

/** Provenance label for the binary control — stated next to it, never hidden. */
export function approvalSourceLabel(source: EffectiveSource): string {
  switch (source) {
    case 'entry':
      return 'entry asks';
    case 'catalog':
      return 'row escalates';
    case 'agent_default':
      return 'agent default';
    case 'default':
      return '';
  }
}

export type BinaryApproval = 'ungated' | 'gated';

/** Binary control position from the effective state — no data loss: the model stays ternary. */
export function binaryFromEffective(mode: 'required' | 'optional'): BinaryApproval {
  return mode === 'required' ? 'gated' : 'ungated';
}

/** Binary control write — writes 'always'/'never' only; legacy 'on_effect' entries keep their value until the maker flips the control. */
export function binaryToEntryApproval(value: BinaryApproval): 'always' | 'never' {
  return value === 'gated' ? 'always' : 'never';
}

/** Minimal per-entry input for the risk counts — the section maps its bound entries to this. */
export interface ToolRiskInput {
  name: string;
  effectful: boolean;
  effectiveMode: 'required' | 'optional';
  pinKind: PinState['kind'];
}

/** Bound effectful tools whose effective approval is optional — the header pill and the Approvals group list. */
export function ungatedEffectful(entries: readonly ToolRiskInput[]): ToolRiskInput[] {
  return entries.filter((e) => e.effectful && e.effectiveMode === 'optional');
}

export interface EffectMix {
  bound: number;
  readOnly: number;
  effectfulUngated: number;
  effectfulGated: number;
}

/** Partition of the bound set for the rail "Effect mix" card. */
export function effectMix(entries: readonly ToolRiskInput[]): EffectMix {
  let readOnly = 0;
  let effectfulUngated = 0;
  let effectfulGated = 0;
  for (const e of entries) {
    if (!e.effectful) {
      readOnly += 1;
    } else if (e.effectiveMode === 'optional') {
      effectfulUngated += 1;
    } else {
      effectfulGated += 1;
    }
  }
  return { bound: entries.length, readOnly, effectfulUngated, effectfulGated };
}

/**
 * Enablement drift — bound entries whose pin state publish refuses
 * (stale/disabled/missing). Unpinned stays a row-level lint, never drift.
 */
export function driftNames(entries: readonly ToolRiskInput[]): string[] {
  return entries
    .filter((e) => e.pinKind === 'stale' || e.pinKind === 'disabled' || e.pinKind === 'missing')
    .map((e) => e.name);
}

/**
 * Relative time for the drift "Re-check" readout ("· 2h ago"). Returns null
 * when there is no timestamp — the UI then shows no time claim at all.
 */
export function formatRelativeTime(dataUpdatedAt: number | null | undefined, nowMs = Date.now()): string | null {
  if (typeof dataUpdatedAt !== 'number' || !Number.isFinite(dataUpdatedAt)) return null;
  const diffMs = Math.max(0, nowMs - dataUpdatedAt);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
