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
    const withExtras = fromEnginePayload({ ...REGISTRY_DEFINITION, brand: 'Warm.', max_context_tokens: 64000 });
    expect(withExtras.brand).toBe('Warm.');
    expect(withExtras.max_context_tokens).toBe(64000);
    expect(fromEnginePayload({}).brand).toBe('');
  });

  it('round-trips brand through the wire (G4)', () => {
    const branded = fromEnginePayload({ ...REGISTRY_DEFINITION, brand: 'Warm, precise.' });
    expect(toEnginePayload(branded)).toMatchObject({ brand: 'Warm, precise.' });
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

  it('omits blank instructions and blank guardrails (zod min(1) fails on empty strings)', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/b'];
    const wire = toEnginePayload(def);
    expect('instructions' in wire).toBe(false);
    expect(wire.guardrail_policy).toEqual({ input_policy: 'default', output_policy: 'brand-safe', pii_redaction: true, execution_mode: 'blocking' });
  });

  it('strips every consumer-only key from the wire (unknown-keys 422 must stay unreachable)', () => {
    const def = consumer();
    def.max_context_tokens = 64000;
    def.retrieval = { memory_max_results: 9, hybrid_retrieval: false };
    const wire = toEnginePayload(def) as unknown as Record<string, unknown>;
    expect('retrieval_policy' in wire).toBe(false);
    expect('max_context_tokens' in wire).toBe(false);
    expect(JSON.stringify(wire)).not.toContain('max_recursion_depth');
  });

  it('ships brand on the wire (G4 first-class) and omits blanks', () => {
    const def = consumer();
    def.brand = 'Warm, precise.';
    expect(toEnginePayload(def).brand).toBe('Warm, precise.');
    const blank = consumer();
    blank.brand = '   ';
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

  it('fails closed on programmer errors (empty models, nameless tools)', () => {
    expect(() => toEnginePayload(defaultConsumer())).toThrow(/allowed_models/);
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
