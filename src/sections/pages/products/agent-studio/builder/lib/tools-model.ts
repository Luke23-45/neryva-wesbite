/**
 * Tools model-policy model (C06 PLAN.md §4) — thin where the engine owns truth,
 * strict where the contract does.
 *
 * Two name rules, two objects (PLAN §8b — never merged):
 * - CATALOG names: ^[a-z][a-z0-9_]{1,63}$ (tool-catalog.service.ts:47,434;
 *   console TOOL_NAME_PATTERN mirrors it — parity asserted by test).
 * - ENTRY names: ^[a-z0-9_]+$ min 2 max 64 (contract; engine min 1, no regex —
 *   contract wins; setup-caps covers shape, this model owns the min-2 floor).
 *
 * Approval display runs through the SINGLE central mapping
 * (agent-payload.effectiveApproval, fixed in this pass per PLAN §8e) with
 * source labels — never a parallel mapping.
 */
import { effectiveApproval, type ConsumerApproval } from '@lib/engine/agent-payload';
import { CAPS } from '@lib/engine/setup-caps';
import { TOOL_NAME_PATTERN } from '@hooks/studio/useSetupTools';

export const TOOLS_MAX = 32;
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

/** Bound-entries gate — contract max 32, unique names (exact match: the engine
 *  lowercases catalog paths server-side and the entry pattern already
 *  forbids case, so exactness is exact). */
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

/** 32-cap hold for the bind affordance (named, never a silent disable). */
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
