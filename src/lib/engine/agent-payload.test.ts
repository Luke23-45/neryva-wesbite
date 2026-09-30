import { describe, expect, it } from 'vitest';
import {
  defaultConsumer,
  effectiveApproval,
  fromEnginePayload,
  toEngineApproval,
  toEnginePayload,
  type ConsumerDefinition,
} from './agent-payload';

/**
 * E0 payload contract (team_setup_ledger.md F-D1) — the single mapping
 * module. The registry-shaped fixture mirrors a real template definition
 * (engine vocabulary: required|optional approvals, provider/model refs).
 */

// Registry-shaped engine definition (cf. support-concierge in
// products/agent-studio/templates/registry.json — same key shapes).
const REGISTRY_DEFINITION = {
  instructions: 'You are a support concierge. Cite sources.',
  model_policy: { allowed_models: ['anthropic/claude-sonnet-4-5'], fallback_enabled: true },
  context_policy: { history_limit: 20, summary_enabled: true, knowledge_sources: ['help-center'], memory_scope: 'organization' },
  tool_policy: {
    tools: [
      { name: 'search_knowledge', access: 'read', approval: 'optional', execution_mode: 'live' },
      { name: 'update_ticket', access: 'write', approval: 'required', execution_mode: 'shadow' },
    ],
  },
  knowledge_policy: { retrieval_enabled: true, max_results: 8 },
  guardrail_policy: { input_policy: 'default', output_policy: 'brand-safe', pii_redaction: true, execution_mode: 'blocking' },
  model_params: { temperature: 0.3, max_output_tokens: 1024 },
  budget_policy: { max_total_tokens: 180000, max_cost_micros: 45000000, wall_clock_seconds: 300, max_tool_calls: 12, max_model_calls: 8 },
};

describe('fromEnginePayload', () => {
  it('reads a registry-shaped definition losslessly', () => {
    const consumer = fromEnginePayload(REGISTRY_DEFINITION);
    expect(consumer.instructions).toBe('You are a support concierge. Cite sources.');
    expect(consumer.model_policy.allowed_models).toEqual(['anthropic/claude-sonnet-4-5']);
    expect(consumer.context_policy.memory_scope).toBe('org');
    expect(consumer.context_policy.knowledge_sources).toEqual(['help-center']);
    expect(consumer.tools).toEqual([
      { name: 'search_knowledge', access: 'read', approval: 'never', execution_mode: 'live' },
      { name: 'update_ticket', access: 'write', approval: 'always', execution_mode: 'shadow' },
    ]);
    expect(consumer.knowledge_policy).toEqual({ retrieval_enabled: true, max_results: 8 });
    expect(consumer.model_params).toMatchObject({ temperature: 0.3, max_output_tokens: 1024 });
    expect(consumer.budget).toMatchObject({ max_total_tokens: 180000, max_cost_cents: 4500, wall_clock_seconds: 300 });
  });

  it('tolerates camelCase drizzle rows and snake_case wire keys', () => {
    const camel = fromEnginePayload({
      modelPolicy: { allowed_models: ['a/b'] },
      contextPolicy: { history_limit: 10, memory_scope: 'user' },
      toolPolicy: { tools: [{ name: 't', access: 'write' }] },
      guardrailPolicy: {},
    });
    expect(camel.model_policy.allowed_models).toEqual(['a/b']);
    expect(camel.context_policy.memory_scope).toBe('user');
    expect(camel.tools[0]).toMatchObject({ name: 't', access: 'write', approval: 'never' });
  });

  it('defaults absent execution_mode to live, tolerates garbage', () => {
    const def = fromEnginePayload({
      ...REGISTRY_DEFINITION,
      tool_policy: { tools: [{ name: 'x', access: 'read', approval: 'optional' }, { name: 'y', access: 'read', approval: 'optional', execution_mode: 'turbo' }] },
    });
    expect(def.tools.map((t) => t.execution_mode)).toEqual(['live', 'live']);
  });

  it('defaults memory scope to the engine default user, resolving garbage there too (C08)', () => {
    expect(defaultConsumer().context_policy.memory_scope).toBe('user');
    expect(fromEnginePayload({}).context_policy.memory_scope).toBe('user');
    expect(fromEnginePayload({ context_policy: { memory_scope: 'everyone' } }).context_policy.memory_scope).toBe('user');
    const user = fromEnginePayload({ context_policy: { memory_scope: 'user' } });
    expect(toEnginePayload({ ...user, model_policy: { allowed_models: ['a/b'], fallback_enabled: false } }).context_policy.memory_scope).toBe('user');
  });

  it('keeps consumer-only fields when present and defaults them otherwise', () => {
    const withExtras = fromEnginePayload({ ...REGISTRY_DEFINITION, brand: { mode: 'raw', content: 'Warm.' }, max_context_tokens: 64000 });
    expect(withExtras.brand).toEqual({ mode: 'raw', content: 'Warm.' });
    expect(withExtras.max_context_tokens).toBe(64000);
    expect(fromEnginePayload({}).brand).toBeUndefined();
  });

  it('round-trips brand through the wire as a modal block', () => {
    const branded = fromEnginePayload({ ...REGISTRY_DEFINITION, brand: { mode: 'markdown', content: '**Warm**, precise.' } });
    expect(toEnginePayload(branded)).toMatchObject({ brand: { mode: 'markdown', content: '**Warm**, precise.' } });
  });

  it('passes response_policy through only when set; garbage resolves to absent', () => {
    const bare = fromEnginePayload(REGISTRY_DEFINITION);
    expect(bare.response_policy).toBeUndefined();
    expect('response_policy' in toEnginePayload(bare)).toBe(false);
    const shaped = fromEnginePayload({
      ...REGISTRY_DEFINITION,
      response_policy: {
        output_format: 'plain',
        citations_enabled: false,
        streaming: 'off',
        reasoning_effort: 'high',
        top_p: 0.9,
      },
    });
    // 19-32: reasoning_effort/top_p are legacy response_policy keys — they
    // migrate into model_params on read and are never re-emitted inside
    // response_policy (the engine's strict schema 400s them there).
    expect(shaped.response_policy).toEqual({
      output_format: 'plain',
      citations_enabled: false,
      streaming: 'off',
    });
    expect(shaped.model_params).toMatchObject({ reasoning_effort: 'high', top_p: 0.9 });
    expect(toEnginePayload(shaped).response_policy).toEqual(shaped.response_policy);
    const garbage = fromEnginePayload({ ...REGISTRY_DEFINITION, response_policy: { output_format: 'html' } });
    expect(garbage.response_policy).toBeUndefined();
    const partial = fromEnginePayload({
      ...REGISTRY_DEFINITION,
      response_policy: { output_format: 'markdown', citations_enabled: true, streaming: 'auto' },
    });
    expect(toEnginePayload(partial).response_policy).toEqual({
      output_format: 'markdown',
      citations_enabled: true,
      streaming: 'auto',
    });
    const sparse = fromEnginePayload({
      ...REGISTRY_DEFINITION,
      response_policy: { output_format: 'plain' },
    });
    // Members are optional on input: a valid partial parses as-is, and the
    // wire materializes the engine defaults for the missing members.
    expect(sparse.response_policy).toEqual({ output_format: 'plain' });
    expect(toEnginePayload(sparse).response_policy).toEqual({
      output_format: 'plain',
      citations_enabled: true,
      streaming: 'auto',
    });
    const customEffort = fromEnginePayload({
      ...REGISTRY_DEFINITION,
      response_policy: { output_format: 'markdown', citations_enabled: true, streaming: 'auto', reasoning_effort: 'turbo' },
    });
    // 19-32: a custom legacy reasoning_effort is preserved in model_params
    // state (setup-caps holds the save until the maker picks a preset, so
    // the custom value never reaches the wire through the real save path) —
    // but it is never re-emitted inside response_policy.
    expect('reasoning_effort' in (customEffort.response_policy ?? {})).toBe(false);
    expect(customEffort.model_params.reasoning_effort).toBe('turbo');
    expect(toEnginePayload(customEffort).response_policy).toEqual({
      output_format: 'markdown',
      citations_enabled: true,
      streaming: 'auto',
    });
  });

  it('passes role through only when set; blanks and garbage resolve to absent', () => {
    // Absent = no persona (valid): nothing on the wire.
    const bare = fromEnginePayload(REGISTRY_DEFINITION);
    expect(bare.role).toBeUndefined();
    expect('role' in toEnginePayload(bare)).toBe(false);
    expect(defaultConsumer().role).toBeUndefined();

    // Full modal role round-trips losslessly (blocks keep their mode).
    const full = {
      role: { mode: 'raw' as const, content: 'Senior support engineer' },
      goal: { content: 'Resolve tickets in one touch.' },
      traits: { content: '["calm", "precise"]' },
      communicationStyle: { mode: 'markdown' as const, content: 'Short paragraphs.' },
      knowledgeAreas: { content: '["billing", "troubleshooting"]' },
      prohibitedTopics: { content: '["politics"]' },
    };
    const shaped = fromEnginePayload({ ...REGISTRY_DEFINITION, role: full });
    expect(shaped.role).toEqual(full);
    expect(toEnginePayload(shaped).role).toEqual(full);

    // Garbage resolves to absent, never a guess.
    expect(fromEnginePayload({ ...REGISTRY_DEFINITION, role: 'concierge' }).role).toBeUndefined();
    expect(fromEnginePayload({ ...REGISTRY_DEFINITION, role: null }).role).toBeUndefined();
    expect(fromEnginePayload({ ...REGISTRY_DEFINITION, role: {} }).role).toBeUndefined();

    // Partial payloads parse as-is; fields stay optional.
    const partial = fromEnginePayload({ ...REGISTRY_DEFINITION, role: { role: { content: 'Concierge' } } });
    expect(partial.role).toEqual({ role: { content: 'Concierge' } });
    expect(toEnginePayload(partial).role).toEqual({ role: { content: 'Concierge' } });

    // Over-cap parsed values drop the field; unparseable-in-mode drops the
    // field; the rest survives (fail-closed per field — garbage resolves
    // to absent, never a guess).
    const oversized = fromEnginePayload({
      ...REGISTRY_DEFINITION,
      role: {
        role: { content: 'x'.repeat(201) },
        goal: { content: 'valid goal' },
        traits: { content: JSON.stringify(['ok', 'x'.repeat(61)]) },
        communicationStyle: { mode: 'json', content: 'not json' },
      },
    });
    expect(oversized.role).toEqual({ goal: { content: 'valid goal' } });

    // Blank fields never ship; clearing everything omits the key instead
    // of persisting a meaningless empty object.
    const blanky = fromEnginePayload({
      ...REGISTRY_DEFINITION,
      role: { role: { content: '  ' }, traits: { content: '[]' }, knowledgeAreas: { content: '  ' } },
    });
    expect(blanky.role).toBeUndefined();
    const cleared = { ...fromEnginePayload({ ...REGISTRY_DEFINITION, role: full }), role: { role: { content: '' } } };
    expect('role' in toEnginePayload(cleared)).toBe(false);
  });

  it('round-trips guardrail execution_mode; absent or garbage resolves blocking', () => {
    const logging = fromEnginePayload({
      ...REGISTRY_DEFINITION,
      guardrail_policy: { input_policy: 'default', output_policy: 'default', pii_redaction: false, execution_mode: 'logging' },
    });
    expect(logging.guardrails.execution_mode).toBe('logging');
    expect(toEnginePayload(logging).guardrail_policy).toMatchObject({ execution_mode: 'logging' });
    const absent = fromEnginePayload({ ...REGISTRY_DEFINITION, guardrail_policy: { input_policy: 'default' } });
    expect(absent.guardrails.execution_mode).toBe('blocking');
    const garbage = fromEnginePayload({
      ...REGISTRY_DEFINITION,
      guardrail_policy: { execution_mode: 'turbo' },
    });
    expect(garbage.guardrails.execution_mode).toBe('blocking');
  });

  it('never crashes on null/partial input', () => {
    expect(fromEnginePayload(null).instructions).toBe('');
    expect(fromEnginePayload({ tool_policy: { tools: [{ name: '' }, null] } }).tools).toEqual([]);
  });
});

describe('toEnginePayload', () => {
  function consumer(): ConsumerDefinition {
    return fromEnginePayload(REGISTRY_DEFINITION);
  }

  it('round-trips a registry definition onto the exact wire shape', () => {
    expect(toEnginePayload(consumer())).toEqual(REGISTRY_DEFINITION);
  });

  it('maps org→organization and collapses approvals (always→required, else optional)', () => {
    const def = consumer();
    def.context_policy.memory_scope = 'org';
    def.tools = [
      { name: 'a', access: 'read', approval: 'never', execution_mode: 'live' },
      { name: 'b', access: 'write', approval: 'on_effect', execution_mode: 'live' },
      { name: 'c', access: 'write', approval: 'always', execution_mode: 'shadow' },
    ];
    const wire = toEnginePayload(def);
    expect(wire.context_policy.memory_scope).toBe('organization');
    expect(wire.tool_policy.tools.map((t) => t.approval)).toEqual(['optional', 'optional', 'required']);
    expect(wire.tool_policy.tools.map((t) => t.execution_mode)).toEqual(['live', 'live', 'shadow']);
  });

  it("passes assistant scope through unmapped and round-trips it (A4-23)", () => {
    const def = consumer();
    def.context_policy.memory_scope = 'assistant';
    const wire = toEnginePayload(def);
    expect(wire.context_policy.memory_scope).toBe('assistant');
    expect(fromEnginePayload(wire).context_policy.memory_scope).toBe('assistant');
  });

  it('omits blank instructions and blank guardrails (zod min(1) fails on empty strings)', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/b'];
    const wire = toEnginePayload(def);
    expect('instructions' in wire).toBe(false);
    expect(wire.guardrail_policy).toEqual({ input_policy: 'default', output_policy: 'brand-safe', pii_redaction: true, execution_mode: 'blocking' });
  });

  it('strips every consumer-only key from the wire (unknown-keys 400 must stay unreachable)', () => {
    const def = consumer();
    def.max_context_tokens = 64000;
    def.retrieval = { memory_max_results: 9 };
    const wire = toEnginePayload(def) as unknown as Record<string, unknown>;
    expect('retrieval_policy' in wire).toBe(false);
    expect('max_context_tokens' in wire).toBe(false);
    expect(JSON.stringify(wire)).not.toContain('max_recursion_depth');
  });

  it('ships brand on the wire as a modal block and omits blanks', () => {
    const def = consumer();
    def.brand = { mode: 'raw', content: 'Warm, precise.' };
    expect(toEnginePayload(def).brand).toEqual({ mode: 'raw', content: 'Warm, precise.' });
    const blank = consumer();
    blank.brand = { mode: 'raw', content: '   ' };
    expect('brand' in toEnginePayload(blank)).toBe(false);
  });

  it('converts budget units (cents→micros) and omits empty budgets', () => {
    const def = consumer();
    def.budget = { max_cost_cents: 500 };
    expect(toEnginePayload(def).budget_policy).toEqual({ max_cost_micros: 5000000 });
    const empty = consumer();
    empty.budget = {};
    expect('budget_policy' in toEnginePayload(empty)).toBe(false);
  });

  it('keeps an explicit $0 spend cap on the wire (C09 — omit-if-falsy would silently uncap)', () => {
    const def = consumer();
    def.budget = { max_cost_cents: 0 };
    expect(toEnginePayload(def).budget_policy).toEqual({ max_cost_micros: 0 });
  });

  it('accepts a model-less draft — empty allowed_models is work-in-progress, not a programmer error', () => {
    const wire = toEnginePayload(defaultConsumer());
    expect(wire.model_policy.allowed_models).toEqual([]);
  });

  it('fails closed on programmer errors (nameless tools)', () => {
    const def = consumer();
    def.tools = [{ name: '  ', access: 'read', approval: 'never', execution_mode: 'live' }];
    expect(() => toEnginePayload(def)).toThrow(/tools\[0\].name/);
  });
});

describe('approval helpers', () => {
  it('maps consumer→engine approvals', () => {
    expect(toEngineApproval('always')).toBe('required');
    expect(toEngineApproval('never')).toBe('optional');
    expect(toEngineApproval('on_effect')).toBe('optional');
  });

  it('computes effective approval against the catalog row', () => {
    expect(effectiveApproval({ approval: 'always' }, 'NONE')).toBe('required');
    expect(effectiveApproval({ approval: 'on_effect' }, 'REQUIRED')).toBe('required');
    expect(effectiveApproval({ approval: 'on_effect' }, 'NONE')).toBe('optional');
    // Catalog REQUIRED escalates regardless of the entry (authorize truth) —
    // even 'never' serves REQUIRED when the row demands it.
    expect(effectiveApproval({ approval: 'never' }, 'REQUIRED')).toBe('required');
    expect(effectiveApproval({ approval: 'never' }, 'NONE')).toBe('optional');
  });
});

describe('spend-cap micros→cents round-trip (19-35 BU-02)', () => {
  const engineDef = (max_cost_micros: number) => ({ budget_policy: { max_cost_micros } });

  it('truncates non-divisible micros on read (documented, never rounded)', () => {
    // 12_345 micros = 1.2345¢ — the consumer model is cent-precision, so the
    // sub-cent remainder is truncated on read rather than carried as a float.
    const consumer = fromEnginePayload(engineDef(12_345));
    expect(consumer.budget.max_cost_cents).toBe(1);
  });

  it('save→load→save is stable for API-set (non-divisible) micros', () => {
    const once = fromEnginePayload(engineDef(12_345));
    const wire = toEnginePayload(once);
    expect(wire.budget_policy?.max_cost_micros).toBe(10_000);
    const twice = fromEnginePayload(wire);
    expect(twice.budget.max_cost_cents).toBe(1);
    // Second save is byte-identical to the first — the round-trip converged.
    expect(toEnginePayload(twice).budget_policy?.max_cost_micros).toBe(10_000);
  });

  it('divisible micros round-trip exactly', () => {
    const consumer = fromEnginePayload(engineDef(45_000_000));
    expect(consumer.budget.max_cost_cents).toBe(4500);
    expect(toEnginePayload(consumer).budget_policy?.max_cost_micros).toBe(45_000_000);
  });

  it('leaves absent and zero caps untouched', () => {
    expect(fromEnginePayload({ budget_policy: {} }).budget.max_cost_cents).toBeUndefined();
    const zero = fromEnginePayload(engineDef(0));
    expect(zero.budget.max_cost_cents).toBe(0);
    expect(toEnginePayload(zero).budget_policy?.max_cost_micros).toBe(0);
  });
});

describe('19-32 legacy response_policy keys (M-08/RP-04)', () => {
  const LEGACY_DRAFT = {
    instructions: 'Legacy draft.',
    model_policy: { allowed_models: ['a/b'], fallback_enabled: false },
    context_policy: { history_limit: 20, summary_enabled: true, knowledge_sources: [], memory_scope: 'user' },
    tool_policy: { tools: [] },
    knowledge_policy: { retrieval_enabled: false, max_results: 5 },
    guardrail_policy: { input_policy: 'default', output_policy: 'brand-safe', pii_redaction: true, execution_mode: 'blocking' },
    model_params: {},
    // Pre-model_params era: the pair lived inside response_policy.
    response_policy: { output_format: 'markdown', citations_enabled: true, streaming: 'auto', reasoning_effort: 'high', top_p: 0.7 },
  };

  it('migrates legacy reasoning_effort/top_p into model_params on read (lossless)', () => {
    const consumer = fromEnginePayload(LEGACY_DRAFT);
    expect(consumer.model_params.reasoning_effort).toBe('high');
    expect(consumer.model_params.top_p).toBe(0.7);
  });

  it('strips the legacy keys from response_policy on read (never re-emitted)', () => {
    const consumer = fromEnginePayload(LEGACY_DRAFT);
    expect(consumer.response_policy).toEqual({ output_format: 'markdown', citations_enabled: true, streaming: 'auto' });
    expect('reasoning_effort' in (consumer.response_policy ?? {})).toBe(false);
    expect('top_p' in (consumer.response_policy ?? {})).toBe(false);
  });

  it('never overwrites canonical model_params with stale legacy keys', () => {
    const both = {
      ...LEGACY_DRAFT,
      model_params: { reasoning_effort: 'low', top_p: 0.3 },
    };
    const consumer = fromEnginePayload(both);
    expect(consumer.model_params.reasoning_effort).toBe('low');
    expect(consumer.model_params.top_p).toBe(0.3);
  });

  it('toEnginePayload never emits reasoning_effort/top_p inside response_policy', () => {
    const consumer = fromEnginePayload(LEGACY_DRAFT);
    const wire = toEnginePayload(consumer) as unknown as Record<string, Record<string, unknown>>;
    expect(wire.response_policy).toEqual({ output_format: 'markdown', citations_enabled: true, streaming: 'auto' });
    expect('reasoning_effort' in wire.response_policy).toBe(false);
    expect('top_p' in wire.response_policy).toBe(false);
  });

  it('round-trips a migrated legacy draft onto the engine-strict wire shape', () => {
    const wire = toEnginePayload(fromEnginePayload(LEGACY_DRAFT)) as unknown as Record<string, Record<string, unknown>>;
    expect(wire.model_params).toMatchObject({ reasoning_effort: 'high', top_p: 0.7 });
    expect(Object.keys(wire.response_policy).sort()).toEqual(['citations_enabled', 'output_format', 'streaming']);
  });

  it('ignores garbage legacy values (non-string effort, non-finite top_p)', () => {
    const garbage = {
      ...LEGACY_DRAFT,
      response_policy: { reasoning_effort: 42, top_p: Number.NaN },
    };
    const consumer = fromEnginePayload(garbage);
    expect(consumer.model_params.reasoning_effort).toBeUndefined();
    expect(consumer.model_params.top_p).toBeUndefined();
  });
});
