/**
 * Setup caps pre-checks (team_setup_ledger.md F-D2) — client-side enforcement
 * of the authoring contract BEFORE any write. Guidance, not authority: the
 * engine still validates (422/409 verbatim). Every bound mirrors
 * `engine/src/modules/assistants/validation.ts` (+ spec §5/§6 where the spec
 * is tighter and says so); re-verify if either moves.
 *
 * Bounds: instructions non-empty + ≤20,000 (spec §6 — engine allows 32,768;
 * the tighter spec cap wins) · models 1–16 `provider/model` shape ·
 * tools ≤32 `{name ^[a-z0-9_]+$, access required, approval}` ·
 * history 1–100 · retrieval results 1–20 · budgets per §5 ·
 * secret shapes rejected before persistence (mirrors validation.ts).
 */
import type { ConsumerDefinition } from './agent-payload';
import { ROLE_LIMITS } from './agent-payload';

export interface CapIssue {
  /** Dotted field path (e.g. `model_policy.allowed_models`, `budget.max_total_tokens`). */
  path: string;
  message: string;
}

export const CAPS = {
  instructionsMax: 20_000,
  brandMax: 2_000,
  modelsMin: 1,
  modelsMax: 16,
  toolsMax: 32,
  toolNamePattern: /^[a-z0-9_]+$/,
  toolNameMax: 64,
  historyMin: 1,
  // The contract ceiling aligns with the runtime served-20: the run reads at
  // most 20 messages, so the editor offers 1–20 (the engine rejects above).
  historyMax: 20,
  resultsMin: 1,
  resultsMax: 20,
  budgetTokensMin: 1000,
  budgetTokensMax: 2_000_000,
  budgetCostMicrosMax: 1_000_000_000_000,
  budgetWallClockMax: 86_400,
  budgetToolCallsMax: 1000,
  budgetModelCallsMin: 1,
  budgetModelCallsMax: 200,
  outputTokensMin: 1,
  outputTokensMax: 200_000,
  slugPattern: /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/,
  slugMax: 64,
  rolloutVariantsMin: 1,
  rolloutVariantsMax: 10,
  rolloutWeightsTotal: 100,
} as const;

// Secret shapes mirrored from engine validation.ts:90-134 — values in
// assignment form (`api_key: sk-…`) and secret-named keys carrying values.
// Prose mentions ("token budget") and numeric budgets pass; pasted
// credentials fail. Word boundaries keep `max_output_tokens`-style schema
// vocabulary green.
const SECRET_ASSIGNMENT = /\b(api[_-]?key|secret|password|bearer|token)\b\s*[:=]\s*\S{4,}/i;
const SECRET_KEY = /\b(api[_-]?key|secret|password|bearer|token)\b/i;

function secretIn(value: unknown, trail: string): string | null {
  if (typeof value === 'string') {
    return SECRET_ASSIGNMENT.test(value) ? `${trail || 'payload'}: suspected pasted credential (assignment shape)` : null;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const hit = secretIn(value[index], `${trail}[${index}]`);
      if (hit) {
        return hit;
      }
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY.test(key) && typeof child === 'string' && child.trim().length >= 4) {
        return `${trail ? `${trail}.` : ''}${key}: secret-named field carries a secret-like value`;
      }
      const hit = secretIn(child, trail ? `${trail}.${key}` : key);
      if (hit) {
        return hit;
      }
    }
  }
  return null;
}

/** Secret scan over the whole consumer definition (instructions + policies). Returns the first hit path or null. */
export function findSecret(def: ConsumerDefinition): string | null {
  return secretIn(
    {
      instructions: def.instructions,
      model_params: def.model_params,
      budget: def.budget,
      guardrails: def.guardrails,
      tools: def.tools,
      context_policy: def.context_policy,
    },
    '',
  );
}

/** Full pre-check of a consumer definition. Empty array = shippable (server still decides). */
export function checkDefinitionCaps(def: ConsumerDefinition): CapIssue[] {
  const issues: CapIssue[] = [];

  if (!def.instructions.trim()) {
    issues.push({ path: 'instructions', message: 'Instructions are required — the agent has nothing to run on without them.' });
  } else if (def.instructions.length > CAPS.instructionsMax) {
    issues.push({
      path: 'instructions',
      message: `Instructions must be ≤ ${CAPS.instructionsMax.toLocaleString()} characters (currently ${def.instructions.length.toLocaleString()}).`,
    });
  }

  // G4: brand ships to the engine (≤2000) and is composed into the served
  // prompt — it is validated like any other wire field now.
  if (def.brand.length > CAPS.brandMax) {
    issues.push({
      path: 'brand',
      message: `Brand voice must be ≤ ${CAPS.brandMax.toLocaleString()} characters (currently ${def.brand.length.toLocaleString()}).`,
    });
  }

  const models = def.model_policy.allowed_models;
  if (models.length < CAPS.modelsMin) {
    issues.push({ path: 'model_policy.allowed_models', message: 'Pick at least one allowed model.' });
  }
  if (models.length > CAPS.modelsMax) {
    issues.push({ path: 'model_policy.allowed_models', message: `At most ${CAPS.modelsMax} models per agent (currently ${models.length}).` });
  }
  models.forEach((model, index) => {
    if (!model.includes('/')) {
      issues.push({
        path: `model_policy.allowed_models[${index}]`,
        message: 'Use the provider/model shape (e.g. anthropic/claude-sonnet-4-5).',
      });
    }
  });

  const maxOut = def.model_params.max_output_tokens;
  if (maxOut !== undefined && (!Number.isInteger(maxOut) || maxOut < CAPS.outputTokensMin || maxOut > CAPS.outputTokensMax)) {
    issues.push({ path: 'model_params.max_output_tokens', message: `Must be an integer ${CAPS.outputTokensMin}–${CAPS.outputTokensMax}.` });
  }

  if (!Number.isInteger(def.context_policy.history_limit) || def.context_policy.history_limit < CAPS.historyMin || def.context_policy.history_limit > CAPS.historyMax) {
    issues.push({ path: 'context_policy.history_limit', message: `Must be an integer ${CAPS.historyMin}–${CAPS.historyMax}.` });
  }
  // C08: all 5 engine scopes are valid (`user` is the default — the old
  // "`user` has no maker meaning" issue was proven false by the FL-1.5 runtime).
  if (!['user', 'none', 'conversation', 'assistant', 'org'].includes(def.context_policy.memory_scope)) {
    issues.push({
      path: 'context_policy.memory_scope',
      message: 'Memory scope is user, none, conversation, assistant, or org.',
    });
  }

  // Response node: absent = engine defaults (no issue). Present = every
  // member that IS present must be in contract (members are optional on
  // input — a partial object is valid; the wire materializes defaults).
  const response = def.response_policy;
  if (response !== undefined) {
    if (
      response.output_format !== undefined &&
      response.output_format !== 'markdown' &&
      response.output_format !== 'plain'
    ) {
      issues.push({ path: 'response_policy.output_format', message: 'Output format is markdown or plain.' });
    }
    if (response.citations_enabled !== undefined && typeof response.citations_enabled !== 'boolean') {
      issues.push({ path: 'response_policy.citations_enabled', message: 'Citations must be on or off.' });
    }
    if (
      response.streaming !== undefined &&
      response.streaming !== 'auto' &&
      response.streaming !== 'on' &&
      response.streaming !== 'off'
    ) {
      issues.push({ path: 'response_policy.streaming', message: 'Streaming is auto, on, or off.' });
    }
    if (response.reasoning_effort !== undefined && typeof response.reasoning_effort !== 'string') {
      issues.push({ path: 'response_policy.reasoning_effort', message: 'Reasoning effort must be a string.' });
    }
    if (
      response.top_p !== undefined &&
      (typeof response.top_p !== 'number' || !Number.isFinite(response.top_p) || response.top_p < 0 || response.top_p > 1)
    ) {
      issues.push({ path: 'response_policy.top_p', message: 'Top P is a number between 0 and 1.' });
    }
  }

  // Response node split: reasoning effort + top-p are model_params members
  // (the engine's responsePolicySchema is strict with only the three render
  // fields; the response_policy checks above stay as foreign-payload defense —
  // parseResponsePolicy still tolerates those members from other clients).
  // Bounds mirror engine validation.ts: enum + z.number().gt(0).max(1).
  const effort = def.model_params.reasoning_effort as string | undefined;
  if (effort !== undefined && !(['minimal', 'low', 'medium', 'high'] as readonly string[]).includes(effort)) {
    issues.push({ path: 'model_params.reasoning_effort', message: 'Reasoning effort is minimal, low, medium, or high.' });
  }
  const topP = def.model_params.top_p;
  if (topP !== undefined && (typeof topP !== 'number' || !Number.isFinite(topP) || topP <= 0 || topP > 1)) {
    issues.push({ path: 'model_params.top_p', message: 'Top-p must be above 0 and at most 1.' });
  }

  // Role node (D-N2 option A — structured persona): absent = no persona (no
  // issue). Present = every member that IS present must be in contract.
  // Bounds mirror the engine's rolePolicySchema (ROLE_LIMITS).
  const rp = def.role_policy;
  if (rp !== undefined) {
    if (rp.role !== undefined && (typeof rp.role !== 'string' || rp.role.length > ROLE_LIMITS.role)) {
      issues.push({ path: 'role_policy.role', message: `Role is at most ${ROLE_LIMITS.role} characters.` });
    }
    if (rp.goal !== undefined && (typeof rp.goal !== 'string' || rp.goal.length > ROLE_LIMITS.goal)) {
      issues.push({ path: 'role_policy.goal', message: `Goal is at most ${ROLE_LIMITS.goal} characters.` });
    }
    if (
      rp.communication_style !== undefined &&
      (typeof rp.communication_style !== 'string' || rp.communication_style.length > ROLE_LIMITS.communication_style)
    ) {
      issues.push({
        path: 'role_policy.communication_style',
        message: `Communication style is at most ${ROLE_LIMITS.communication_style} characters.`,
      });
    }
    const lists: Array<{ value: string[] | undefined; path: string; max: number; item: number; label: string }> = [
      { value: rp.traits, path: 'role_policy.traits', max: ROLE_LIMITS.traits.max, item: ROLE_LIMITS.traits.item, label: 'Traits' },
      {
        value: rp.knowledge_areas,
        path: 'role_policy.knowledge_areas',
        max: ROLE_LIMITS.knowledge_areas.max,
        item: ROLE_LIMITS.knowledge_areas.item,
        label: 'Knowledge areas',
      },
      {
        value: rp.prohibited_topics,
        path: 'role_policy.prohibited_topics',
        max: ROLE_LIMITS.prohibited_topics.max,
        item: ROLE_LIMITS.prohibited_topics.item,
        label: 'Prohibited topics',
      },
    ];
    for (const { value, path, max, item, label } of lists) {
      if (value === undefined) continue;
      if (!Array.isArray(value) || value.length > max || value.some((t) => typeof t !== 'string' || t.length > item)) {
        issues.push({ path, message: `${label}: at most ${max} items of ${item} characters each.` });
      }
    }
  }

  if (def.tools.length > CAPS.toolsMax) {
    issues.push({ path: 'tools', message: `At most ${CAPS.toolsMax} tools per agent (currently ${def.tools.length}).` });
  }
  def.tools.forEach((tool, index) => {
    const at = `tools[${index}]`;
    if (!tool.name.trim()) {
      issues.push({ path: `${at}.name`, message: 'Every tool needs a name.' });
    } else {
      if (tool.name.length > CAPS.toolNameMax) {
        issues.push({ path: `${at}.name`, message: `Tool names must be ≤ ${CAPS.toolNameMax} characters.` });
      }
      if (!CAPS.toolNamePattern.test(tool.name)) {
        issues.push({ path: `${at}.name`, message: 'Lowercase letters, digits, and underscores only.' });
      }
    }
    if (tool.schema_hash !== undefined && !/^[0-9a-f]{64}$/i.test(tool.schema_hash)) {
      issues.push({ path: `${at}.schema_hash`, message: 'Schema pins are 64 hex characters.' });
    }
  });

  if (!Number.isInteger(def.knowledge_policy.max_results) || def.knowledge_policy.max_results < CAPS.resultsMin || def.knowledge_policy.max_results > CAPS.resultsMax) {
    issues.push({ path: 'knowledge_policy.max_results', message: `Must be an integer ${CAPS.resultsMin}–${CAPS.resultsMax}.` });
  }

  const budget = def.budget;
  if (budget.max_total_tokens !== undefined && (!Number.isInteger(budget.max_total_tokens) || budget.max_total_tokens < CAPS.budgetTokensMin || budget.max_total_tokens > CAPS.budgetTokensMax)) {
    issues.push({ path: 'budget.max_total_tokens', message: `Must be an integer ${CAPS.budgetTokensMin.toLocaleString()}–${CAPS.budgetTokensMax.toLocaleString()}.` });
  }
  if (budget.max_cost_cents !== undefined && (budget.max_cost_cents < 0 || budget.max_cost_cents * 10_000 > CAPS.budgetCostMicrosMax)) {
    issues.push({ path: 'budget.max_cost_cents', message: 'Must be non-negative and within the platform cost ceiling.' });
  }
  if (budget.wall_clock_seconds !== undefined && (!Number.isInteger(budget.wall_clock_seconds) || budget.wall_clock_seconds < 0 || budget.wall_clock_seconds > CAPS.budgetWallClockMax)) {
    issues.push({ path: 'budget.wall_clock_seconds', message: `Must be an integer 0–${CAPS.budgetWallClockMax} (24h).` });
  }
  if (budget.max_tool_calls !== undefined && (!Number.isInteger(budget.max_tool_calls) || budget.max_tool_calls < 0 || budget.max_tool_calls > CAPS.budgetToolCallsMax)) {
    issues.push({ path: 'budget.max_tool_calls', message: `Must be an integer 0–${CAPS.budgetToolCallsMax}.` });
  }
  if (budget.max_model_calls !== undefined && (!Number.isInteger(budget.max_model_calls) || budget.max_model_calls < CAPS.budgetModelCallsMin || budget.max_model_calls > CAPS.budgetModelCallsMax)) {
    issues.push({ path: 'budget.max_model_calls', message: `Must be an integer ${CAPS.budgetModelCallsMin}–${CAPS.budgetModelCallsMax}.` });
  }

  const secret = findSecret(def);
  if (secret) {
    issues.push({ path: 'secrets', message: `Remove pasted credential material before saving — ${secret}.` });
  }

  return issues;
}

/** First blocking problem (form-level), or null when shippable. */
export function validateConsumer(def: ConsumerDefinition): string | null {
  const issues = checkDefinitionCaps(def);
  return issues.length > 0 ? issues[0].message : null;
}

/**
 * Caps-issue path → editor section (the editor groups inline issues by
 * section; unknown paths fall back to instructions so issues never vanish).
 */
export function sectionOf(path: string): string {
  if (path === 'instructions' || path === 'secrets') {
    return path;
  }
  if (path === 'brand') {
    return 'retrieval';
  }
  const top = path.split('.')[0].split('[')[0];
  switch (top) {
    case 'model_policy':
    case 'model_params':
      return 'model';
    case 'context_policy':
      return 'context';
    case 'response_policy':
      return 'response';
    case 'role_policy':
      return 'role';
    case 'tools':
      return 'tools';
    case 'knowledge_policy':
      return 'retrieval';
    case 'guardrail_policy':
      return 'guardrails';
    case 'budget':
      return 'budget';
    default:
      return 'instructions';
  }
}

/** Source-slug pre-check (mirrors engine source-slug.ts — server validates regardless). Null = shippable. */
export function checkSourceSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  if (!CAPS.slugPattern.test(normalized) || normalized.length > CAPS.slugMax) {
    return 'Slugs are 3–64 characters: lowercase letters, digits, hyphens; starts and ends with a letter or digit.';
  }
  return null;
}

/** Rollout variants pre-check (mirrors rollouts.service.ts parse rules). Returns issues, empty = shippable. */
export function checkRolloutVariants(variants: Array<{ version_id: string; weight: number }>): CapIssue[] {
  const issues: CapIssue[] = [];
  if (variants.length < CAPS.rolloutVariantsMin || variants.length > CAPS.rolloutVariantsMax) {
    issues.push({ path: 'versions', message: `Rollouts carry ${CAPS.rolloutVariantsMin}–${CAPS.rolloutVariantsMax} variants.` });
  }
  variants.forEach((variant, index) => {
    if (!variant.version_id.trim()) {
      issues.push({ path: `versions[${index}].version_id`, message: 'Every variant needs a published version.' });
    }
    if (!Number.isInteger(variant.weight) || variant.weight <= 0) {
      issues.push({ path: `versions[${index}].weight`, message: 'Weights are positive integers.' });
    }
  });
  const total = variants.reduce((sum, variant) => sum + (Number.isInteger(variant.weight) ? variant.weight : 0), 0);
  if (variants.length > 0 && total !== CAPS.rolloutWeightsTotal) {
    issues.push({ path: 'versions', message: `Weights must sum to exactly ${CAPS.rolloutWeightsTotal} (currently ${total}).` });
  }
  return issues;
}
