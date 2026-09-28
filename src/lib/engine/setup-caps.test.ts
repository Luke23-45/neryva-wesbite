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

  it('requires instructions and caps them at 20,000', () => {
    const empty = shippable();
    empty.instructions = '  ';
    expect(checkDefinitionCaps(empty).some((i) => i.path === 'instructions')).toBe(true);
    const long = shippable();
    long.instructions = `x${'y'.repeat(20_000)}`;
    expect(checkDefinitionCaps(long).some((i) => i.path === 'instructions')).toBe(true);
  });

  it('bounds models 1–16 with provider/model shape', () => {
    const none = shippable();
    none.model_policy.allowed_models = [];
    expect(checkDefinitionCaps(none).some((i) => i.path === 'model_policy.allowed_models')).toBe(true);
    const many = shippable();
    many.model_policy.allowed_models = Array.from({ length: 17 }, (_, i) => `a/m${i}`);
    expect(checkDefinitionCaps(many).some((i) => i.path === 'model_policy.allowed_models')).toBe(true);
    const shapeless = shippable();
    shapeless.model_policy.allowed_models = ['reasoner'];
    expect(checkDefinitionCaps(shapeless).some((i) => i.path.includes('allowed_models[0]'))).toBe(true);
  });

  it('bounds history 1–20 (contract aligned to the runtime served-20) and tools ≤32 with slug-safe names', () => {
    const history = shippable();
    history.context_policy.history_limit = 0;
    expect(checkDefinitionCaps(history).some((i) => i.path === 'context_policy.history_limit')).toBe(true);
    const over = shippable();
    over.context_policy.history_limit = 21;
    expect(checkDefinitionCaps(over).some((i) => i.path === 'context_policy.history_limit')).toBe(true);
    const atMax = shippable();
    atMax.context_policy.history_limit = 20;
    expect(checkDefinitionCaps(atMax).some((i) => i.path === 'context_policy.history_limit')).toBe(false);
    const tools = shippable();
    tools.tools = Array.from({ length: 33 }, (_, i) => ({ name: `t${i}`, access: 'read' as const, approval: 'never' as const, execution_mode: 'live' as const }));
    expect(checkDefinitionCaps(tools).some((i) => i.path === 'tools')).toBe(true);
    const named = shippable();
    named.tools = [{ name: 'Bad-Name!', access: 'read', approval: 'never', execution_mode: 'live' }];
    expect(checkDefinitionCaps(named).some((i) => i.path === 'tools[0].name')).toBe(true);
    const pinned = shippable();
    pinned.tools = [{ name: 't', access: 'read', approval: 'never', execution_mode: 'live', schema_hash: 'zzz' }];
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
    full.response_policy = {
      output_format: 'plain',
      citations_enabled: false,
      streaming: 'on',
      reasoning_effort: 'high',
      top_p: 0.9,
    };
    expect(checkDefinitionCaps(full).some((i) => i.path.startsWith('response_policy'))).toBe(false);
    const bad = shippable();
    bad.response_policy = { output_format: 'html', citations_enabled: true, streaming: 'sometimes' } as never;
    const issues = checkDefinitionCaps(bad).filter((i) => i.path.startsWith('response_policy'));
    expect(issues.map((i) => i.path).sort()).toEqual(['response_policy.output_format', 'response_policy.streaming']);
    const badTopP = shippable();
    badTopP.response_policy = { output_format: 'markdown', citations_enabled: true, streaming: 'auto', top_p: 2 };
    expect(checkDefinitionCaps(badTopP).some((i) => i.path === 'response_policy.top_p')).toBe(true);
    // Members are optional on input: a valid partial holds no autosave.
    const partial = shippable();
    partial.response_policy = { output_format: 'plain' };
    expect(checkDefinitionCaps(partial).some((i) => i.path.startsWith('response_policy'))).toBe(false);
  });
  it('accepts an absent role_policy and rejects out-of-contract persona values', () => {
    // Absent = no persona (valid): no issues.
    const absent = shippable();
    expect(checkDefinitionCaps(absent).some((i) => i.path.startsWith('role_policy'))).toBe(false);
    // A full valid persona holds no autosave.
    const full = shippable();
    full.role_policy = {
      role: 'Senior support engineer',
      goal: 'Resolve tickets in one touch.',
      traits: ['calm', 'precise'],
      communication_style: 'Short paragraphs.',
      knowledge_areas: ['billing'],
      prohibited_topics: ['politics'],
    };
    expect(checkDefinitionCaps(full).some((i) => i.path.startsWith('role_policy'))).toBe(false);
    // A valid partial holds no autosave.
    const partial = shippable();
    partial.role_policy = { role: 'Concierge' };
    expect(checkDefinitionCaps(partial).some((i) => i.path.startsWith('role_policy'))).toBe(false);
    // Over-limit text members and lists hold the save.
    const bad = shippable();
    bad.role_policy = {
      role: 'x'.repeat(201),
      goal: 'y'.repeat(501),
      communication_style: 'z'.repeat(501),
      traits: new Array(11).fill('trait'),
      knowledge_areas: ['x'.repeat(81)],
      prohibited_topics: new Array(21).fill('topic'),
    };
    const issues = checkDefinitionCaps(bad).filter((i) => i.path.startsWith('role_policy'));
    expect(issues.map((i) => i.path).sort()).toEqual([
      'role_policy.communication_style',
      'role_policy.goal',
      'role_policy.knowledge_areas',
      'role_policy.prohibited_topics',
      'role_policy.role',
      'role_policy.traits',
    ]);
    // Non-string members are invalid too.
    const wrongType = shippable();
    wrongType.role_policy = { role: 42, traits: 'calm' } as never;
    const typeIssues = checkDefinitionCaps(wrongType).filter((i) => i.path.startsWith('role_policy'));
    expect(typeIssues.map((i) => i.path).sort()).toEqual(['role_policy.role', 'role_policy.traits']);
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

  it('caps brand voice at 2000 chars (G4 first-class wire field)', () => {
    const branded = shippable();
    branded.brand = 'x'.repeat(2001);
    expect(checkDefinitionCaps(branded).some((i) => i.path === 'brand')).toBe(true);
    const ok = shippable();
    ok.brand = 'Warm.';
    expect(checkDefinitionCaps(ok)).toEqual([]);
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
    expect(sectionOf('role_policy.traits')).toBe('role');
    expect(sectionOf('role_policy')).toBe('role');
    expect(sectionOf('tools[0].name')).toBe('tools');
    expect(sectionOf('knowledge_policy.max_results')).toBe('retrieval');
    expect(sectionOf('budget.max_total_tokens')).toBe('budget');
  });

  it('falls back to instructions for unknown paths (issues never vanish)', () => {
    expect(sectionOf('')).toBe('instructions');
    expect(sectionOf('mystery.field')).toBe('instructions');
  });

  it('routes guardrail 422s to the guardrails section (C07 — was instructions)', () => {
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
