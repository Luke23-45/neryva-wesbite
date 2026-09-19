/**
 * Brain model-policy model (C04 PLAN.md §3) — PURE, zero imports.
 *
 * Engine bounds encoded (validation.ts:5-25,55-58 — re-verify if it moves):
 * temperature 0–2; top_p (0,1]; max_output_tokens 1–200,000; reasoning_effort
 * minimal|low|medium|high; output_schema ≤16,384 valid JSON object; allowed
 * 1–16 refs `provider/model`. Presets MUST land inside these ranges — asserted
 * by test so a future edit cannot silently leave the contract.
 */

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

export interface PresetParams {
  temperature: number;
  top_p: number;
  max_output_tokens: number;
  reasoning_effort: Exclude<ReasoningEffort, 'minimal'>;
}

export interface ModelPreset {
  id: 'clerk' | 'scholar' | 'creator';
  label: string;
  blurb: string;
  params: PresetParams;
}

export const MODEL_PRESETS: readonly ModelPreset[] = [
  {
    id: 'clerk',
    label: 'Clerk',
    blurb: 'Deterministic ops: exact extractions, classifications, structured replies.',
    params: { temperature: 0, top_p: 1, max_output_tokens: 4096, reasoning_effort: 'low' },
  },
  {
    id: 'scholar',
    label: 'Scholar',
    blurb: 'Deep reasoning: hard problems, long analysis, careful trade-offs.',
    params: { temperature: 0.7, top_p: 1, max_output_tokens: 16000, reasoning_effort: 'high' },
  },
  {
    id: 'creator',
    label: 'Creator',
    blurb: 'Open generation: drafts, rewrites, brainstorms with range.',
    params: { temperature: 1, top_p: 0.95, max_output_tokens: 8000, reasoning_effort: 'medium' },
  },
];

/** Engine ranges (validation.ts) — single source for sliders, clamps, tests. */
export const ENGINE_RANGES = {
  temperature: { min: 0, max: 2, step: 0.1 },
  topP: { min: 0, max: 1, exclusiveMin: true, step: 0.05 },
  maxOutputTokens: { min: 1, max: 200000 },
  outputSchemaMax: 16384,
  allowedModelsMax: 16,
} as const;

/** Current params equal a preset (computed badge — never stored). */
export function matchPreset(params: {
  temperature?: number;
  top_p?: number;
  max_output_tokens?: number;
  reasoning_effort?: string;
}): ModelPreset | null {
  for (const preset of MODEL_PRESETS) {
    if (
      params.temperature === preset.params.temperature &&
      (params.top_p ?? 1) === preset.params.top_p &&
      params.max_output_tokens === preset.params.max_output_tokens &&
      params.reasoning_effort === preset.params.reasoning_effort
    ) {
      return preset;
    }
  }
  return null;
}

export type ModelReason =
  | 'provider_credential_missing'
  | 'provider_not_enabled'
  | 'residency_incompatible'
  | 'credential_compromised';

export type ReasonAction = 'connect' | 'enable' | 'profile' | 'incident';

const REASON_FIX: Record<ModelReason, { label: string; action: ReasonAction }> = {
  provider_credential_missing: { label: 'Connect a credential', action: 'connect' },
  provider_not_enabled: { label: 'Ask an admin to enable', action: 'enable' },
  residency_incompatible: { label: 'Switch profile', action: 'profile' },
  credential_compromised: { label: 'Rotate the key', action: 'incident' },
};

/** SPEC inline fixes — unknown reasons degrade to a truthful label, never a guess. */
export function reasonFix(reason: string): { label: string; action: ReasonAction | null } {
  const hit = (REASON_FIX as Record<string, { label: string; action: ReasonAction }>)[reason];
  if (hit) return hit;
  return { label: 'See Models library', action: null };
}

const REASON_LABEL: Record<ModelReason, string> = {
  provider_credential_missing: 'credential missing',
  provider_not_enabled: 'provider not enabled',
  residency_incompatible: 'residency incompatible',
  credential_compromised: 'credential_compromised (derived)',
};

/**
 * Human reason — the derived suffix is PART of the label (SPEC bind: engine has
 * no 4th code; the derivation is always visible, never footnoted away).
 */
export function humanizeReason(reason: string): string {
  return (REASON_LABEL as Record<string, string>)[reason] ?? reason;
}

/** Minimal catalog shape for usability math (superset-compatible). */
export interface CatalogRow {
  ref: string;
  usable: boolean;
  reasons: string[];
}

/** Allowed refs the catalog deems usable (unknown catalog → none, never a guess). */
export function usableRefs(
  allowed: readonly string[],
  catalog: readonly CatalogRow[] | null | undefined,
): string[] {
  if (!catalog) return [];
  const usable = new Set(catalog.filter((m) => m.usable).map((m) => m.ref));
  return allowed.filter((ref) => usable.has(ref));
}

export interface ModelBlocker {
  ref: string;
  /** Null = ref not in the catalog at all (publish refuses unknown models). */
  reason: string | null;
}

/** First allowed model that cannot serve (list order = priority order). */
export function firstBlocker(
  allowed: readonly string[],
  catalog: readonly CatalogRow[] | null | undefined,
): ModelBlocker | null {
  if (!catalog) return null;
  const byRef = new Map(catalog.map((m) => [m.ref, m]));
  for (const ref of allowed) {
    const row = byRef.get(ref);
    if (!row) return { ref, reason: null };
    if (!row.usable) return { ref, reason: row.reasons[0] ?? 'unknown' };
  }
  return null;
}
/** Reorder helper for the fallback chain (bounds-clamped, pure, non-mutating). */
export function moveModel(refs: readonly string[], from: number, to: number): string[] {
  if (from < 0 || from >= refs.length) return [...refs];
  const clamped = Math.min(Math.max(to, 0), refs.length - 1);
  if (clamped === from) return [...refs];
  const next = [...refs];
  const [moved] = next.splice(from, 1);
  next.splice(clamped, 0, moved);
  return next;
}

export type SchemaCheck = { ok: true } | { ok: false; message: string };

/** Output-schema gate (caps doesn't cover it — local check owns it, PLAN §12.3). */
export function validateOutputSchema(text: string): SchemaCheck {
  if (text.trim() === '') return { ok: true };
  if (text.length > ENGINE_RANGES.outputSchemaMax) {
    return {
      ok: false,
      message: `Schema must be ≤ ${ENGINE_RANGES.outputSchemaMax.toLocaleString()} characters (currently ${text.length.toLocaleString()}).`,
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: 'Not valid JSON — the engine requires a JSON object schema.' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, message: 'Must be a JSON object schema, not an array or primitive.' };
  }
  return { ok: true };
}
