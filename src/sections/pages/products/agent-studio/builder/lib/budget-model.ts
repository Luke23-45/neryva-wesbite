/**
 * C09 budget model — pure cap grading + estimate math (C09 PLAN §4).
 *
 * Engine truth mirrored here (cited, never re-derived per view):
 * - bounds (`engine/src/modules/assistants/validation.ts:33-41`): tokens
 *   1000–2M; cost micros 0–1e12; wall 0–86400; tools 0–1000; models 1–200;
 * - served defaults (Studio compile `context-activities.ts:69-72` + live
 *   `inline-executor.ts:391-398`): tokens 200k; models 16; tools 8; wall 120s;
 *   cost UNSET/0 = unenforced (`maxCostMicros > 0` gate, :930-934);
 * - fail-closed breach (`inline-executor.ts:926-947` + watchdog): FAILED +
 *   terminal event naming the dimension + quota release;
 * - cached-input UNIT PRICE only (`model-cost.service.ts:123-153`); no usage
 *   split is reported anywhere — shown when reported, never derived.
 */

export interface BudgetCaps {
  max_total_tokens?: number;
  max_cost_cents?: number;
  wall_clock_seconds?: number;
  max_tool_calls?: number;
  max_model_calls?: number;
}

export const BUDGET_BOUNDS = {
  max_total_tokens: { min: 1000, max: 2_000_000 },
  max_cost_micros: { min: 0, max: 1_000_000_000_000 },
  wall_clock_seconds: { min: 0, max: 86_400 },
  max_tool_calls: { min: 0, max: 1000 },
  max_model_calls: { min: 1, max: 200 },
} as const;

/** Served when unset — the exact Studio compile matrix (PLAN §1). */
export const PLATFORM_DEFAULTS = {
  max_total_tokens: 200_000,
  max_model_calls: 16,
  max_tool_calls: 8,
  /** Seconds. Explicit 0 compiles to this too (`|| 120_000`). */
  wall_clock_seconds: 120,
} as const;

export type BudgetCapKey = 'max_cost_cents' | 'max_total_tokens' | 'max_tool_calls' | 'max_model_calls' | 'wall_clock_seconds';

export const CAP_LABELS: Record<BudgetCapKey, string> = {
  max_cost_cents: 'Spend cap',
  max_total_tokens: 'Total tokens',
  max_tool_calls: 'Tool calls',
  max_model_calls: 'Model calls',
  wall_clock_seconds: 'Wall clock',
};

/**
 * SINGLE unset-vs-zero resolver — every cap row reads this. Unset states the
 * platform default EXCEPT cost, where unset AND 0 both mean unenforced (the
 * `> 0` gate makes them identical — the loudest row gets the loudest copy).
 * Breach law lives ONLY in FAIL_CLOSED_COPY (Block C / panel footer) — rows
 * carry row-specific copy, never a repeated chorus.
 */
export function describeCap(key: BudgetCapKey, value: number | undefined): { state: string; whisper: string } {
  switch (key) {
    case 'max_cost_cents':
      if (value === undefined || value <= 0) {
        return { state: 'No spend cap', whisper: 'Unset or $0 — runs are cost-unchecked. Set a cap to enforce spend.' };
      }
      return { state: formatDollars(value), whisper: 'Enforced between turns.' };
    case 'max_total_tokens':
      if (value === undefined) {
        return { state: 'Platform default (200,000)', whisper: 'Unset serves 200,000 tokens per run.' };
      }
      return { state: `${value.toLocaleString()} tokens`, whisper: '' };
    case 'max_tool_calls':
      if (value === undefined || value === 0) {
        return { state: 'Platform default (8)', whisper: value === 0 ? '0 serves 8 — set 1–1000 to change it.' : 'Unset serves 8 tool calls per run.' };
      }
      return { state: `${value} calls`, whisper: '' };
    case 'max_model_calls':
      if (value === undefined) {
        return { state: 'Platform default (16)', whisper: 'Unset serves 16 model calls per run.' };
      }
      return { state: `${value} calls`, whisper: 'Min 1 — a disable control cannot exist.' };
    case 'wall_clock_seconds':
      if (value === undefined || value === 0) {
        return { state: 'Platform default (120s)', whisper: value === 0 ? '0 serves 120s — not an instant fail.' : 'Unset serves a 120s wall clock per run.' };
      }
      return { state: formatDuration(value), whisper: '' };
  }
}

export function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds}s`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}min`;
}

/** $/1k display matching `costLabel` precision (4dp). */
export function formatRatePer1k(microsPer1k: number): string {
  return `$${(microsPer1k / 1_000_000).toFixed(4)}/1k`;
}

export interface PricedModel {
  ref: string;
  costMicrosPer1kInput: number | null;
  costMicrosPer1kOutput: number | null;
  costMicrosPer1kCachedInput: number | null;
}

/**
 * Rough run estimate at UNCACHED rates (research R3 — never `input × standard`
 * laundered as a bill). Returns null when neither side is priced.
 */
export function estimateRun(tokens: number, cost: PricedModel): { micros: number; rough: true } | null {
  if (cost.costMicrosPer1kInput === null && cost.costMicrosPer1kOutput === null) return null;
  const per1k = (cost.costMicrosPer1kInput ?? 0) + (cost.costMicrosPer1kOutput ?? 0);
  return { micros: (tokens / 1000) * per1k, rough: true };
}

export function formatEstimate(micros: number): string {
  return `~$${(micros / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Cached price line — reported or nothing (never derived, the lone-half rule). */
export function cachedPriceLine(cost: PricedModel): string | null {
  if (cost.costMicrosPer1kCachedInput === null) return null;
  return `cached-in ${formatRatePer1k(cost.costMicrosPer1kCachedInput)}`;
}

export interface BudgetGrade {
  status: 'ready';
  subtitle: string;
  hint: string;
}

/**
 * Projector grading (PLAN §6): budget never degrades — deliberate config reads
 * ready (C05 retrieval-off precedent). Cost-unset reads `No spend cap` loudly.
 */
export function gradeBudget(budget: BudgetCaps, estimateMicros: number | null): BudgetGrade {
  const capped = budget.max_cost_cents !== undefined && budget.max_cost_cents > 0;
  if (capped && estimateMicros !== null) {
    return { status: 'ready', subtitle: `Capped · ${formatEstimate(estimateMicros)} rough`, hint: '' };
  }
  if (capped) {
    return { status: 'ready', subtitle: `Capped at ${formatDollars(budget.max_cost_cents as number)}`, hint: '' };
  }
  const anySet =
    budget.max_total_tokens !== undefined ||
    budget.max_tool_calls !== undefined ||
    budget.max_model_calls !== undefined ||
    budget.wall_clock_seconds !== undefined;
  if (anySet) {
    return { status: 'ready', subtitle: 'No spend cap', hint: '' };
  }
  return { status: 'ready', subtitle: 'Platform defaults', hint: '' };
}

// ─── Copy constants ──────────────────────────────────────────────────────────

/** Fail-closed law (executor + watchdog, PLAN §1). */
export const FAIL_CLOSED_COPY =
  'If a cap breaks, the run fails closed — FAILED, a terminal event naming the dimension, quota released.';

/** Estimates are rough by construction (research R2/R3). */
export const ESTIMATE_COPY =
  'Rough, not the bill — uncached rates, measured spend lives in Usage.';

/** Budget edits ride version writes (agent-payload toWire) — publish serves them. */
export const PUBLISH_COPY = 'Budget edits ship with the version — publish to serve them.';
