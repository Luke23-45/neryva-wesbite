/**
 * C07 guardrails model — pure policy/mode grading (C07 PLAN §4).
 *
 * Engine truth mirrored here (cited, never re-derived per view):
 * - 4-field policy + blocking|logging default blocking
 *   (`engine/src/modules/assistants/validation.ts:94-109`);
 * - behavior resolver (`engine/src/common/guardrails/moderation.ts:148-162`):
 *   off|disabled → disabled; strict → strict; default|brand-safe|unknown → standard.
 * - contract enums (`products/agent-studio/contracts/agent-definition/v1.schema.json:149-170`):
 *   input [default, strict, permissive], output [brand-safe, default, strict].
 *
 * Load-bearing honesty rules (PLAN §8.2–8.3):
 * - `permissive` is NEVER offered as a preset: the engine resolver does not know
 *   it, so it screens exactly like `default` — a Permissive preset would lie.
 * - `brand-safe` ≡ `default` behaviorally; the UI never claims distinct behavior.
 * - Only `off`/`disabled` truly disables screening; custom names are allowed
 *   (engine min(1)) but resolve to standard screening — always shown, never hidden.
 */

import type { GuardrailExecutionMode } from '@lib/engine/agent-payload';

export type { GuardrailExecutionMode };

export const GUARDRAIL_MODES: readonly GuardrailExecutionMode[] = ['blocking', 'logging'];

/** Garbage → blocking (engine default; C06 parse precedent). */
export function parseGuardrailMode(raw: unknown): GuardrailExecutionMode {
  return raw === 'logging' ? 'logging' : 'blocking';
}

export type PolicyDirection = 'input' | 'output';

export const INPUT_PRESETS = ['default', 'strict', 'off'] as const;
export const OUTPUT_PRESETS = ['brand-safe', 'default', 'strict', 'off'] as const;

export type PolicyBehavior = 'disabled' | 'strict' | 'standard';

export interface ResolvedPolicyBehavior {
  behavior: PolicyBehavior;
  /** Plain-words consequence, mode-aware (logging NEVER promises refusal). */
  consequence: string;
}

/**
 * SINGLE display mirror of the engine resolver — every view reads this, never
 * its own switch. `name` is the raw policy string (blank = engine default).
 */
export function resolvePolicyBehavior(name: string, mode: GuardrailExecutionMode): ResolvedPolicyBehavior {
  const value = name.trim();
  if (value === 'off' || value === 'disabled') {
    return {
      behavior: 'disabled',
      consequence: 'Screening off — violations pass through unscreened.',
    };
  }
  if (value === 'strict') {
    return {
      behavior: 'strict',
      consequence:
        mode === 'logging'
          ? 'Screens everything — borderline verdicts recorded, nothing refused.'
          : 'Screens everything — also refuses borderline content.',
    };
  }
  return {
    behavior: 'standard',
    consequence:
      mode === 'logging'
        ? 'Screened — verdicts recorded, nothing refused.'
        : 'Screened — refuses violating content.',
  };
}

/** Blank console value → the engine default name (never shown as empty). */
export function displayPolicyName(name: string, direction: PolicyDirection): string {
  const value = name.trim();
  if (value !== '') return value;
  return direction === 'input' ? 'default' : 'brand-safe';
}

/** True when the raw string disables screening for its direction. */
export function isPolicyOff(name: string): boolean {
  const value = name.trim();
  return value === 'off' || value === 'disabled';
}

export interface GuardrailPolicyState {
  input_policy: string;
  output_policy: string;
  pii_redaction: boolean;
  execution_mode: GuardrailExecutionMode;
}

export interface GuardrailGrade {
  status: 'ready' | 'attention';
  subtitle: string;
  hint: string;
}

/**
 * Projector grading truth table (PLAN §6):
 * - logging → attention (measuring, nothing refused);
 * - any direction off → attention naming the direction;
 * - else ready (PII-off stays ready with a stated whisper — deliberate, not broken).
 * - no policy content at all → ready `Platform defaults` (born-ready).
 */
export function gradeGuardrails(policy: GuardrailPolicyState): GuardrailGrade {
  const inputName = displayPolicyName(policy.input_policy, 'input');
  const outputName = displayPolicyName(policy.output_policy, 'output');
  const coverage = `in ${inputName} / out ${outputName}`;
  if (policy.execution_mode === 'logging') {
    return {
      status: 'attention',
      subtitle: `Logging · ${coverage}`,
      hint: 'Flip to blocking when false positives settle — the flip ships as a new draft.',
    };
  }
  const off: string[] = [];
  if (isPolicyOff(policy.input_policy)) off.push('input screening off');
  if (isPolicyOff(policy.output_policy)) off.push('output screening off');
  if (off.length > 0) {
    return {
      status: 'attention',
      subtitle: `Blocking · ${off.join(' · ')}`,
      hint: 'Pick a preset to re-enable screening.',
    };
  }
  return {
    status: 'ready',
    subtitle: `Blocking · ${coverage} · PII ${policy.pii_redaction ? 'on' : 'off'}`,
    hint: policy.pii_redaction
      ? ''
      : 'PII off — identifiers reach storage, logs, and the provider.',
  };
}

// ─── Copy constants (English-only, no i18n infra) ────────────────────────────

export const MODE_COPY = {
  blocking: 'Blocking — violating content is refused.',
  logging: 'Logging — verdicts recorded, nothing is refused.',
} as const satisfies Record<GuardrailExecutionMode, string>;

/** Versions are immutable: the policy is per-version truth (R3). */
export const PII_NON_RETRO_COPY = 'Applies to new runs from publish — past runs keep what they stored.';

export const PII_OFF_COPY = 'PII off — identifiers reach storage, logs, and the provider.';

/** Engine law (validation.ts:98-108): the flip is a definition change. */
export const FLIP_COPY = 'The flip ships as a new draft — auditable, never a silent toggle.';

export const CUSTOM_NAME_COPY = 'A name you invent screens like Default — shown above, never hidden.';
