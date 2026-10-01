import { describe, expect, it } from 'vitest';
import { defaultConsumer } from './agent-payload';
import { checkDefinitionCaps, checkRolloutVariants, checkSourceSlug, sectionOf, validateConsumer } from './setup-caps';

function shippable() {
  const def = defaultConsumer();
  def.instructions = 'You are a probe. Be concise.';
  def.model_policy.allowed_models = ['acme/reasoner-1'];
  return def;
}

describe('checkDefinitionCaps', () => {
  it('passes a minimal shippable definition', () => {
    expect(checkDefinitionCaps(shippable())).toEqual([]);
    expect(validateConsumer(shippable())).toBeNull();
  });

  it('requires instructions and caps them at 32,768 (engine/DB/contract bound)', () => {
    const empty = shippable();
    empty.instructions = '  ';
    expect(checkDefinitionCaps(empty).some((i) => i.path === 'instructions')).toBe(true);
    const long = shippable();
    long.instructions = `x${'y'.repeat(32_768)}`;
    expect(checkDefinitionCaps(long).some((i) => i.path === 'instructions')).toBe(true);
    const withinEngineCeiling = shippable();
    withinEngineCeiling.instructions = `x${'y'.repeat(25_000)}`;
    expect(checkDefinitionCaps(withinEngineCeiling).some((i) => i.path === 'instructions')).toBe(false);
  });

  it('bounds models 0–20 with provider/model shape (empty pipeline is a valid draft)', () => {
    const none = shippable();
    none.model_policy.allowed_models = [];
    // Draft path: an empty pipeline is work-in-progress, not a cap issue.
    // The publish gate (not the draft save) refuses shipping without a model.
    expect(checkDefinitionCaps(none).some((i) => i.path === 'model_policy.allowed_models')).toBe(false);
    const many = shippable();
    many.model_policy.allowed_models = Array.from({ length: 21 }, (_, i) => `a/m${i}`);
    expect(checkDefinitionCaps(many).some((i) => i.path === 'model_policy.allowed_models')).toBe(true);
    const atMax = shippable();
    atMax.model_policy.allowed_models = Array.from({ length: 20 }, (_, i) => `a/m${i}`);
    expect(checkDefinitionCaps(atMax).some((i) => i.path === 'model_policy.allowed_models')).toBe(false);
    const shapeless = shippable();
    shapeless.model_policy.allowed_models = ['reasoner'];
    expect(checkDefinitionCaps(shapeless).some((i) => i.path.includes('allowed_models[0]'))).toBe(true);
  });

  it('bounds history 1–20 (contract aligned to the runtime served-20) and tools ≤50 with slug-safe names', () => {
    const history = shippable();
    history.context_policy.history_limit = 0;
    expect(checkDefinitionCaps(history).some((i) => i.path === 'context_policy.history_limit')).toBe(true);
    const over = shippable();
    over.context_policy.history_limit = 21;
    expect(checkDefinitionCaps(over).some((i) => i.path === 'context_policy.history_limit')).toBe(true);
    const atMax = shippable();
    atMax.context_policy.history_limit = 20;
    expect(checkDefinitionCaps(atMax).some((i) => i.path === 'context_policy.history_limit')).toBe(false);

    // v1.15: the context token budget rides inside context_policy (int
    // 1000–200000, default 32000).
    const lowTokens = shippable();
    lowTokens.context_policy.max_context_tokens = 999;
    expect(checkDefinitionCaps(lowTokens).some((i) => i.path === 'context_policy.max_context_tokens')).toBe(true);
    const highTokens = shippable();
    highTokens.context_policy.max_context_tokens = 200001;
    expect(checkDefinitionCaps(highTokens).some((i) => i.path === 'context_policy.max_context_tokens')).toBe(true);
    const fractional = shippable();
    fractional.context_policy.max_context_tokens = 32000.5;
    expect(checkDefinitionCaps(fractional).some((i) => i.path === 'context_policy.max_context_tokens')).toBe(true);
    const atMinTokens = shippable();
    atMinTokens.context_policy.max_context_tokens = 1000;
    expect(checkDefinitionCaps(atMinTokens).some((i) => i.path === 'context_policy.max_context_tokens')).toBe(false);
    const atMaxTokens = shippable();
    atMaxTokens.context_policy.max_context_tokens = 200000;
    expect(checkDefinitionCaps(atMaxTokens).some((i) => i.path === 'context_policy.max_context_tokens')).toBe(false);
    const tools = shippable();
    tools.tools = Array.from({ length: 51 }, (_, i) => ({ name: `t${i}`, access: 'read' as const, approval: 'never' as const, execution_mode: 'live' as const, enabled: true, expose_description_to_planner: true, log_call_payloads: true }));
    expect(checkDefinitionCaps(tools).some((i) => i.path === 'tools')).toBe(true);
    const atMaxTools = shippable();
    atMaxTools.tools = Array.from({ length: 50 }, (_, i) => ({ name: `t${i}`, access: 'read' as const, approval: 'never' as const, execution_mode: 'live' as const, enabled: true, expose_description_to_planner: true, log_call_payloads: true }));
    expect(checkDefinitionCaps(atMaxTools).some((i) => i.path === 'tools')).toBe(false);
    const named = shippable();
    named.tools = [{ name: 'Bad-Name!', access: 'read', approval: 'never', execution_mode: 'live', enabled: true, expose_description_to_planner: true, log_call_payloads: true }];
    expect(checkDefinitionCaps(named).some((i) => i.path === 'tools[0].name')).toBe(true);
    const pinned = shippable();
    pinned.tools = [{ name: 't', access: 'read', approval: 'never', execution_mode: 'live', schema_hash: 'zzz', enabled: true, expose_description_to_planner: true, log_call_payloads: true }];
    expect(checkDefinitionCaps(pinned).some((i) => i.path === 'tools[0].schema_hash')).toBe(true);
  });

  it('accepts all 5 engine memory scopes, rejecting garbage', () => {
    const assistant = shippable();
    assistant.context_policy.memory_scope = 'assistant';
    expect(checkDefinitionCaps(assistant).some((i) => i.path === 'context_policy.memory_scope')).toBe(false);
    const garbage = shippable();
    garbage.context_policy.memory_scope = 'everyone' as never;
    expect(checkDefinitionCaps(garbage).some((i) => i.path === 'context_policy.memory_scope')).toBe(true);
  });

  it('accepts an absent response_policy and rejects out-of-contract values', () => {
    const absent = shippable();
    expect(checkDefinitionCaps(absent).some((i) => i.path.startsWith('response_policy'))).toBe(false);
    const full = shippable();
    // 19-32: reasoning_effort/top_p no longer live on response_policy — they
    // ride model_params (the engine's strict responsePolicySchema 400s them).
    full.response_policy = {
      output_format: 'plain',
      citations_enabled: false,
      streaming: 'on',
    };
    full.model_params.reasoning_effort = 'high';
    full.model_params.top_p = 0.9;
    expect(checkDefinitionCaps(full).some((i) => i.path.startsWith('response_policy'))).toBe(false);
    expect(checkDefinitionCaps(full).some((i) => i.path.startsWith('model_params'))).toBe(false);
    const bad = shippable();
    bad.response_policy = { output_format: 'html', citations_enabled: true, streaming: 'sometimes' } as never;
    const issues = checkDefinitionCaps(bad).filter((i) => i.path.startsWith('response_policy'));
    expect(issues.map((i) => i.path).sort()).toEqual(['response_policy.output_format', 'response_policy.streaming']);
    // 19-32: the legacy response_policy top_p check is gone — top_p is a
    // model_params member now, validated there.
    const badTopP = shippable();
    badTopP.model_params.top_p = 2;
    expect(checkDefinitionCaps(badTopP).some((i) => i.path === 'model_params.top_p')).toBe(true);
    // Members are optional on input: a valid partial holds no autosave.
    const partial = shippable();
    partial.response_policy = { output_format: 'plain' };
    expect(checkDefinitionCaps(partial).some((i) => i.path.startsWith('response_policy'))).toBe(false);
  });
  it('accepts an absent role and rejects out-of-contract field values', () => {
    // Absent = no persona (valid): no issues.
    const absent = shippable();
    expect(checkDefinitionCaps(absent).some((i) => i.path.startsWith('role.'))).toBe(false);
    // A full valid role holds no autosave.
    const full = shippable();
    full.role = {
      role: { content: 'Senior support engineer' },
      goal: { content: 'Resolve tickets in one touch.' },
      traits: { content: '["calm", "precise"]' },
      communicationStyle: { content: 'Short paragraphs.' },
      knowledgeAreas: { content: '["billing"]' },
      prohibitedTopics: { content: '["politics"]' },
    };
    expect(checkDefinitionCaps(full).some((i) => i.path.startsWith('role.'))).toBe(false);
    // A valid partial holds no autosave.
    const partial = shippable();
    partial.role = { role: { content: 'Concierge' } };
    expect(checkDefinitionCaps(partial).some((i) => i.path.startsWith('role.'))).toBe(false);
    // Over-limit PARSED values hold the save (caps apply to parsed values,
    // not raw mode text — mode is not content).
    const bad = shippable();
    bad.role = {
      role: { content: 'x'.repeat(201) },
      goal: { content: 'y'.repeat(501) },
      communicationStyle: { content: 'z'.repeat(501) },
      traits: { content: JSON.stringify(new Array(11).fill('trait')) },
      knowledgeAreas: { content: JSON.stringify(['x'.repeat(81)]) },
      prohibitedTopics: { content: JSON.stringify(new Array(21).fill('topic')) },
    };
    const issues = checkDefinitionCaps(bad).filter((i) => i.path.startsWith('role.'));
    expect(issues.map((i) => i.path).sort()).toEqual([
      'role.communicationStyle',
      'role.goal',
      'role.knowledgeAreas',
      'role.prohibitedTopics',
      'role.role',
      'role.traits',
    ]);
    // Unparseable-in-mode fields are invalid too.
    const badMode = shippable();
    badMode.role = {
      role: { mode: 'json', content: 'Concierge' },
      traits: { content: 'calm' },
    };
    const modeIssues = checkDefinitionCaps(badMode).filter((i) => i.path.startsWith('role.'));
    expect(modeIssues.map((i) => i.path).sort()).toEqual(['role.role', 'role.traits']);
    expect(modeIssues.every((i) => i.message.endsWith('not valid in its selected mode.'))).toBe(true);
  });
  it('drops blank list entries at parse — they never hold the save', () => {
    // Blank entries are filtered when the block parses (engine parity), so
    // a hand-crafted "" inside a JSON list resolves to a shorter list,
    // never a caps issue.
    const blanky = shippable();
    blanky.role = {
      traits: { content: '["calm", ""]' },
      knowledgeAreas: { content: '["billing"]' },
      prohibitedTopics: { content: '[""]' },
    };
    expect(checkDefinitionCaps(blanky).some((i) => i.path.startsWith('role.'))).toBe(false);
    // Non-empty fields hold no autosave.
    const ok = shippable();
    ok.role = { traits: { content: '["calm", "precise"]' }, prohibitedTopics: { content: '["politics"]' } };
    expect(checkDefinitionCaps(ok).some((i) => i.path.startsWith('role.'))).toBe(false);
  });
  it('bounds budgets per the engine caps', () => {
    const tokens = shippable();
    tokens.budget = { max_total_tokens: 999 };
    expect(checkDefinitionCaps(tokens).some((i) => i.path === 'budget.max_total_tokens')).toBe(true);
    const calls = shippable();
    calls.budget = { max_model_calls: 0 };
    expect(checkDefinitionCaps(calls).some((i) => i.path === 'budget.max_model_calls')).toBe(true);
    const wall = shippable();
    wall.budget = { wall_clock_seconds: 86_401 };
    expect(checkDefinitionCaps(wall).some((i) => i.path === 'budget.wall_clock_seconds')).toBe(true);
  });

  it('rejects pasted credential material but passes prose and budgets', () => {
    const leaky = shippable();
    leaky.instructions = 'Use api_key: sk-live-12345 for the lookup.';
    expect(checkDefinitionCaps(leaky).some((i) => i.path === 'secrets')).toBe(true);
    const keyed = shippable();
    keyed.model_params = { temperature: 0.3 };
    (keyed.model_params as Record<string, unknown>).api_key = 'sk-live-12345';
    expect(checkDefinitionCaps(keyed).some((i) => i.path === 'secrets')).toBe(true);
    const prose = shippable();
    prose.instructions = 'Explain the token budget and the password reset flow.';
    prose.budget = { max_total_tokens: 100000 };
    expect(checkDefinitionCaps(prose)).toEqual([]);
  });

  it('accepts all 4 engine memory scopes, user included (C08 — was refused)', () => {
    for (const scope of ['user', 'none', 'conversation', 'org'] as const) {
      const scoped = shippable();
      scoped.context_policy.memory_scope = scope;
      expect(checkDefinitionCaps(scoped).some((i) => i.path === 'context_policy.memory_scope')).toBe(false);
    }
    const bogus = shippable();
    (bogus.context_policy as { memory_scope: unknown }).memory_scope = 'everyone';
    expect(checkDefinitionCaps(bogus).some((i) => i.path === 'context_policy.memory_scope')).toBe(true);
  });

  it('caps brand voice at 2000 parsed chars (modal block)', () => {
    const branded = shippable();
    branded.brand = { mode: 'raw', content: 'x'.repeat(2001) };
    expect(checkDefinitionCaps(branded).some((i) => i.path === 'brand')).toBe(true);
    const ok = shippable();
    ok.brand = { mode: 'raw', content: 'Warm.' };
    expect(checkDefinitionCaps(ok)).toEqual([]);
  });

  it('flags brand content that is invalid in its selected mode', () => {
    const bad = shippable();
    bad.brand = { mode: 'json', content: 'not json at all' };
    const issues = checkDefinitionCaps(bad).filter((i) => i.path === 'brand');
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/not valid in its selected mode/);
  });

  it('measures the parsed value against the cap — padding counts, quoting does not', () => {
    // The engine caps the parsed value as written (modalTextField): raw
    // padding is content, while JSON quoting is metadata around the string.
    const padded = shippable();
    padded.brand = { mode: 'raw', content: `  ${'x'.repeat(1999)}  ` };
    expect(checkDefinitionCaps(padded).some((i) => i.path === 'brand')).toBe(true);
    const quoted = shippable();
    quoted.brand = { mode: 'json', content: JSON.stringify('x'.repeat(2000)) };
    expect(checkDefinitionCaps(quoted).some((i) => i.path === 'brand')).toBe(false);
  });
});

describe('checkSourceSlug', () => {
  it.each(['help-center', 'doc-a1b2c3d4', 'ext-sitemap-9f8e7d6c', 'a-b-c'])('accepts %p', (slug) => {
    expect(checkSourceSlug(slug)).toBeNull();
  });

  // NOTE: the engine lowercases before validating (source-slug.ts), so
  // UPPER is accepted-as-`upper` — the UI mirrors that, never refuses it.
  it.each(['ab', '-lead', 'trail-', 'has space', 'under_score', 'x'.repeat(65)])('refuses %p', (slug) => {
    expect(checkSourceSlug(slug)).not.toBeNull();
  });

  it('accepts uppercase via engine normalization', () => {
    expect(checkSourceSlug('UPPER')).toBeNull();
  });
});

describe('sectionOf (caps issues → editor sections)', () => {
  it('routes top-level and nested paths', () => {
    expect(sectionOf('instructions')).toBe('instructions');
    expect(sectionOf('secrets')).toBe('secrets');
    expect(sectionOf('brand')).toBe('retrieval');
    expect(sectionOf('model_policy.allowed_models')).toBe('model');
    expect(sectionOf('model_params.max_output_tokens')).toBe('model');
    expect(sectionOf('context_policy.history_limit')).toBe('context');
    expect(sectionOf('response_policy.output_format')).toBe('response');
    expect(sectionOf('response_policy')).toBe('response');
    expect(sectionOf('role.traits')).toBe('role');
    expect(sectionOf('role')).toBe('role');
    expect(sectionOf('tools[0].name')).toBe('tools');
    expect(sectionOf('knowledge_policy.max_results')).toBe('retrieval');
    expect(sectionOf('budget.max_total_tokens')).toBe('budget');
  });

  it('falls back to instructions for unknown paths (issues never vanish)', () => {
    expect(sectionOf('')).toBe('instructions');
    expect(sectionOf('mystery.field')).toBe('instructions');
  });

  it('routes guardrail 400s to the guardrails section (C07 — was instructions)', () => {
    expect(sectionOf('guardrail_policy.input_policy')).toBe('guardrails');
    expect(sectionOf('guardrail_policy.execution_mode')).toBe('guardrails');
  });
});

describe('checkRolloutVariants', () => {
  it('passes weights summing to exactly 100', () => {
    expect(checkRolloutVariants([{ version_id: 'v1', weight: 90 }, { version_id: 'v2', weight: 10 }])).toEqual([]);
  });

  it('refuses empty sets, bad weights, and non-100 totals', () => {
    expect(checkRolloutVariants([]).length).toBeGreaterThan(0);
    expect(checkRolloutVariants([{ version_id: '', weight: 100 }]).some((i) => i.path.includes('version_id'))).toBe(true);
    expect(checkRolloutVariants([{ version_id: 'v1', weight: 0 }]).some((i) => i.path.includes('weight'))).toBe(true);
    expect(checkRolloutVariants([{ version_id: 'v1', weight: 99 }]).some((i) => i.path === 'versions')).toBe(true);
  });
});
