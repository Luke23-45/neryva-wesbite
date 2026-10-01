/**
 * C07 guardrails model — pure policy/mode grading (C07 PLAN §4).
 *
 * Engine truth mirrored here (cited, never re-derived per view):
 * - extended policy (engine/src/modules/assistants/validation.ts):
 *   input_policy / output_policy strings, pii_redaction bool,
 *   pii_entities (6-enum array, default all), pii_action (mask|token|drop,
 *   default token), pii_applies_to (storage|logs|traces, default
 *   storage+logs), notify_owner bool (default false), attach_to_trace bool
 *   (default true), deny_topics (max 50, deduped, default []),
 *   execution_mode blocking|logging (default blocking);
 * - runtime sink truth (products/agent-studio packages/security + both
 *   runtime lanes): the policy is applied only to the 'storage' sink —
 *   applyPiiPolicy is called only with 'storage', and run events/OTel spans
 *   never carry raw content by design (categories/codes only). The console
 *   therefore pins pii_applies_to to ['storage']; the wire schema still
 *   accepts the other sink strings.
 * - behavior resolver (engine/src/common/guardrails/moderation.ts):
 *   off|disabled|none → disabled; strict → strict;
 *   default|brand-safe|unknown → standard.
 * - contract enums (`products/agent-studio/contracts/agent-definition/v1.schema.json:149-170`):
 *   input [default, strict, permissive], output [brand-safe, default, strict].
 *
 * Load-bearing honesty rules (PLAN §8.2–8.3):
 * - `permissive` is NEVER offered as a preset: the engine resolver does not know
 *   it, so it screens exactly like `default` — a Permissive preset would lie.
 * - `brand-safe` ≡ `default` behaviorally; the UI never claims distinct behavior.
 * - Only `off`/`disabled`/`none` truly disable screening; custom names are allowed
 *   (engine min(1)) but resolve to standard screening — always shown, never hidden.
 * - The Off segment writes `none`: the engine resolver honors it as disabled,
 *   and it reads as a deliberate key rather than a legacy synonym.
 */

import type { GuardrailExecutionMode, PiiAction, PiiEntityType, PiiSink } from '@lib/engine/agent-payload';
import { DENY_TOPICS_MAX, PII_ENTITY_TYPES, PII_SINKS } from '@lib/engine/agent-payload';

export type { GuardrailExecutionMode, PiiAction, PiiEntityType, PiiSink };
export { DENY_TOPICS_MAX };

export const GUARDRAIL_MODES: readonly GuardrailExecutionMode[] = ['blocking', 'logging'];

/** Garbage → blocking (engine default; C06 parse precedent). */
export function parseGuardrailMode(raw: unknown): GuardrailExecutionMode {
  return raw === 'logging' ? 'logging' : 'blocking';
}

/**
 * Canonical JSON for dirty comparison (G-BUG3): object keys are sorted
 * recursively, so two semantically equal policies compare equal even if a
 * patch ever writes keys in a different order or an unnormalized value.
 * Arrays keep their order (entity/sink/topic order is significant).
 */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export type PolicyDirection = 'input' | 'output';

export const INPUT_PRESETS = ['default', 'strict', 'none'] as const;
export const OUTPUT_PRESETS = ['brand-safe', 'default', 'strict', 'none'] as const;

/* ── SVG-redesign segmented controls ───────────────────────────────────────
 * The redesign uses iOS-style segmented controls instead of preset pills.
 * Off writes the 'none' key: the engine resolver (moderation.ts) honors
 * off|disabled|none as disabled, and 'none' reads as the deliberate console
 * key rather than a legacy synonym.
 */

export const INPUT_SEGMENTS = [
  { value: 'none', label: 'Off' },
  { value: 'default', label: 'Default' },
  { value: 'strict', label: 'Strict' },
] as const;

export const OUTPUT_SEGMENTS = [
  { value: 'none', label: 'Off' },
  { value: 'default', label: 'Default' },
  { value: 'strict', label: 'Strict' },
  { value: 'brand-safe', label: 'Brand-safe' },
] as const;

/**
 * Which segment the raw policy string selects, or null when the name is
 * custom (shown honestly as a custom-name note, never forced onto a segment).
 * Blank reads as the engine default segment.
 */
export function matchSegment(raw: string, direction: PolicyDirection): string | null {
  const value = raw.trim();
  if (value === '') return direction === 'input' ? 'default' : 'brand-safe';
  // The engine honors the disabled synonyms — surface them as Off, honestly.
  if (value === 'off' || value === 'disabled' || value === 'none') return 'none';
  const segments = direction === 'input' ? INPUT_SEGMENTS : OUTPUT_SEGMENTS;
  if ((segments as readonly { value: string }[]).some((s) => s.value === value)) return value;
  return null;
}

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
  if (value === 'off' || value === 'disabled' || value === 'none') {
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
          ? 'Screens everything — borderline verdicts recorded; deny topics still refused on contact.'
          : 'Screens everything — also refuses borderline content.',
    };
  }
  return {
    behavior: 'standard',
    consequence:
      mode === 'logging'
        ? 'Screened — verdicts recorded; deny topics still refused on contact.'
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
  return value === 'off' || value === 'disabled' || value === 'none';
}

export interface GuardrailPolicyState {
  input_policy: string;
  output_policy: string;
  pii_redaction: boolean;
  execution_mode: GuardrailExecutionMode;
  pii_entities: PiiEntityType[];
  pii_action: PiiAction;
  pii_applies_to: PiiSink[];
  notify_owner: boolean;
  attach_to_trace: boolean;
  deny_topics: string[];
}

export interface GuardrailGrade {
  status: 'ready' | 'attention' | 'untouched';
  subtitle: string;
  hint: string;
}

/**
 * True when the policy carries no user content — every field reads as the
 * engine default (validation.ts: input 'default', output 'brand-safe', PII
 * redaction on with all entities + token action + storage/logs scope,
 * notify off, attach on, no deny topics, blocking mode). Blank console
 * values count as default (displayPolicyName maps them the same way). Such
 * a policy is `untouched`, never born-ready: defaults are not user content.
 */
export function isGuardrailPolicyDefault(policy: GuardrailPolicyState): boolean {
  const input = policy.input_policy.trim();
  const output = policy.output_policy.trim();
  const entities = [...(policy.pii_entities ?? [])].sort().join(',');
  const sinks = [...(policy.pii_applies_to ?? [])].sort().join(',');
  return (
    (input === '' || input === 'default') &&
    (output === '' || output === 'brand-safe') &&
    policy.pii_redaction !== false &&
    entities === [...PII_ENTITY_TYPES].sort().join(',') &&
    policy.pii_action === 'token' &&
    sinks === 'storage' &&
    policy.notify_owner !== true &&
    policy.attach_to_trace !== false &&
    (policy.deny_topics ?? []).length === 0 &&
    policy.execution_mode === 'blocking'
  );
}

/**
 * Projector grading truth table (PLAN §6):
 * - no policy content at all → untouched (engine defaults are not user content);
 * - logging → attention (measuring — screening verdicts recorded; deny topics still refuse);
 * - any direction off → attention naming the direction;
 * - deny topics present → ready (a hard refusal list is configured intent);
 * - else ready (PII-off stays ready with a stated whisper — deliberate, not broken).
 */
export function gradeGuardrails(policy: GuardrailPolicyState): GuardrailGrade {
  if (isGuardrailPolicyDefault(policy)) {
    return {
      status: 'untouched',
      subtitle: 'Not configured',
      hint: 'Engine defaults screen standard content — set a policy in the Guardrails section to own it.',
    };
  }
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
  const topics = (policy.deny_topics ?? []).length;
  return {
    status: 'ready',
    subtitle: `Blocking · ${coverage} · PII ${policy.pii_redaction ? 'on' : 'off'}${topics > 0 ? ` · ${topics} ${topics === 1 ? 'deny topic' : 'deny topics'}` : ''}`,
    hint: policy.pii_redaction
      ? ''
      : 'PII off — identifiers reach storage and the provider.',
  };
}

// ─── PII entity / action / scope ─────────────────────────────────────────────

export const PII_ENTITY_LABELS: Record<PiiEntityType, string> = {
  email: 'Email',
  phone: 'Phone',
  payment_card: 'Payment card',
  government_id: 'Government ID',
  api_keys: 'API keys',
  addresses: 'Addresses',
};

export const PII_ACTION_OPTIONS: readonly { value: PiiAction; label: string }[] = [
  { value: 'mask', label: 'Mask' },
  { value: 'token', label: 'Replace with token' },
  { value: 'drop', label: 'Drop sentence' },
];

export const PII_SINK_LABELS: Record<PiiSink, string> = {
  storage: 'Storage',
  logs: 'Logs',
  traces: 'Traces',
};

/** Garbage → the engine default (all entities); an explicit [] stays []. */
export function parsePiiEntities(raw: unknown): PiiEntityType[] {
  if (!Array.isArray(raw)) return [...PII_ENTITY_TYPES];
  return (raw as unknown[]).filter((v): v is PiiEntityType =>
    typeof v === 'string' && (PII_ENTITY_TYPES as readonly string[]).includes(v),
  );
}

/** Garbage → 'token' (engine default). */
export function parsePiiAction(raw: unknown): PiiAction {
  return raw === 'mask' || raw === 'token' || raw === 'drop' ? raw : 'token';
}

/** Garbage → ['storage'] (the only sink the runtime honors); an explicit [] stays []. */
export function parsePiiSinks(raw: unknown): PiiSink[] {
  if (!Array.isArray(raw)) return ['storage'];
  const kept = (raw as unknown[]).filter((v): v is PiiSink =>
    typeof v === 'string' && (PII_SINKS as readonly string[]).includes(v),
  );
  // Root cause (P1): the runtime applies the policy only to the 'storage'
  // sink — applyPiiPolicy is called only with 'storage' in both runtime
  // lanes, and run events/OTel spans never carry raw content by design, so
  // logs/traces scope was an inert control. Collapse every legacy/mixed
  // value to ['storage'] so the edit state matches what the runtime
  // actually redacts; an explicit [] stays [] (scope deliberately empty).
  return kept.length === 0 ? [] : ['storage'];
}

// ─── Deny topics ─────────────────────────────────────────────────────────────

/** Normalize a deny-topic list the engine's way: trim, drop blanks, cap 50, dedupe. */
export function normalizeDenyTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    const topic = typeof entry === 'string' ? entry.trim() : '';
    if (topic === '' || topic.length > 200) continue;
    const key = topic.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(topic);
    if (out.length >= DENY_TOPICS_MAX) break;
  }
  return out;
}

/**
 * Validate a candidate topic before adding it to the list. Returns the
 * problem, or null when the topic is addable.
 */
export function validateDenyTopic(candidate: string, existing: readonly string[]): string | null {
  const topic = candidate.trim();
  if (topic === '') return 'Type a topic first.';
  if (topic.length > 200) return 'Topics are capped at 200 characters.';
  if (existing.length >= DENY_TOPICS_MAX) return `Deny topics are capped at ${DENY_TOPICS_MAX}.`;
  if (existing.some((t) => t.toLowerCase() === topic.toLowerCase())) return 'That topic is already denied.';
  return null;
}

// ─── Copy constants (English-only, no i18n infra) ────────────────────────────

export const MODE_COPY = {
  blocking: 'Blocking — violating content is refused.',
  logging: 'Logging — screening verdicts recorded; deny topics still refused on contact.',
} as const satisfies Record<GuardrailExecutionMode, string>;

/** Versions are immutable: the policy is per-version truth (R3). */
export const PII_NON_RETRO_COPY = 'Applies to new runs from publish — past runs keep what they stored.';

export const PII_OFF_COPY = 'PII off — identifiers reach storage and the provider.';

/**
 * Honest sink scope (P1): redaction runs only against the committed result.
 * Run events and traces never carry raw content by design, so there is no
 * logs/traces sink to select — the control is a statement, not a switch.
 */
export const PII_SINK_SCOPE_COPY =
  'Committed run results (storage). Run events never carry raw content, so there is nothing to redact from logs or traces.';

/** Engine law (validation.ts:98-108): the flip is a definition change. */
export const FLIP_COPY = 'The flip ships as a new draft — auditable, never a silent toggle.';

export const CUSTOM_NAME_COPY = 'A name you invent screens like Default — shown above, never hidden.';

/**
 * Paste overflow (Wave 4 item 8): the input's maxLength cuts pasted text
 * silently at the browser level, before validateDenyTopic ever runs — name
 * the cut at the point it happens so the shortened text never reads as the
 * user's own wording.
 */
export const TOPIC_PASTE_TRUNCATED_COPY = 'Pasted text was cut to 200 characters.';
