import { describe, expect, it } from 'vitest';
import { defaultConsumer, type ConsumerDefinition } from '@lib/engine/agent-payload';
import { diffChangedSections } from './version-diff';

function withPatch(patch: (def: ConsumerDefinition) => void): ConsumerDefinition {
  const def = defaultConsumer();
  patch(def);
  return def;
}

describe('diffChangedSections', () => {
  it('returns empty when either side is missing (never fakes a count)', () => {
    const def = defaultConsumer();
    expect(diffChangedSections(null, def)).toEqual([]);
    expect(diffChangedSections(def, null)).toEqual([]);
    expect(diffChangedSections(undefined, def)).toEqual([]);
  });

  it('returns empty for identical definitions', () => {
    expect(diffChangedSections(defaultConsumer(), defaultConsumer())).toEqual([]);
  });

  it('attributes whole-key changes to their sections', () => {
    const live = defaultConsumer();
    const draft = withPatch((d) => {
      d.instructions = 'new instructions';
      d.brand = 'new brand';
    });
    expect(diffChangedSections(draft, live)).toEqual(['instructions', 'brand']);
  });

  it('splits model_params: reasoning_effort → brain, the rest → model', () => {
    const live = defaultConsumer();
    const draft = withPatch((d) => {
      d.model_params.reasoning_effort = 'high';
      d.model_params.temperature = 0.9;
    });
    expect(diffChangedSections(draft, live)).toEqual(['model', 'brain']);
  });

  it('splits context_policy: knowledge_sources → knowledge, the rest → context', () => {
    const live = defaultConsumer();
    const draft = withPatch((d) => {
      d.context_policy.knowledge_sources = ['slug-a'];
      d.context_policy.history_limit = 5;
    });
    expect(diffChangedSections(draft, live)).toEqual(['knowledge', 'context']);
  });

  it('attributes role, guardrails, tools, budget, response to their sections', () => {
    const live = defaultConsumer();
    const draft = withPatch((d) => {
      d.role = { role: { content: 'Concierge' } };
      d.guardrails = { ...d.guardrails, pii_redaction: !d.guardrails.pii_redaction };
      d.tools = [...d.tools, { name: 'web_search', access: 'read', approval: 'on_effect', execution_mode: 'live' }];
      d.budget = { ...d.budget, max_tool_calls: 7 };
      d.response_policy = { output_format: 'plain' };
    });
    expect(diffChangedSections(draft, live)).toEqual(['role', 'tools', 'guardrails', 'response', 'budget']);
  });

  it('is key-order insensitive (no false positives from serialization)', () => {
    const live = defaultConsumer();
    const draft = defaultConsumer();
    draft.model_policy = { fallback_enabled: live.model_policy.fallback_enabled, allowed_models: [...live.model_policy.allowed_models] };
    expect(diffChangedSections(draft, live)).toEqual([]);
  });

  it('maps max_context_tokens to context', () => {
    const live = defaultConsumer();
    const draft = withPatch((d) => {
      d.max_context_tokens = (d.max_context_tokens ?? 0) + 1000;
    });
    expect(diffChangedSections(draft, live)).toEqual(['context']);
  });
});
