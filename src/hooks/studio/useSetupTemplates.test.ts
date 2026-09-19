import { describe, expect, it } from 'vitest';
import { parseTemplateList, reasonFix } from './useSetupTemplates';

// Registry-shaped entry (cf. products/agent-studio/templates/registry.json).
const ENTRY = {
  template: {
    slug: 'support-concierge',
    version: '1.0.0',
    status: 'stable',
    family: 'support',
    definition: {
      instructions: 'You are a support concierge.',
      model_policy: { allowed_models: ['anthropic/claude-sonnet-4-5'] },
    },
    bindings: {
      tools: {
        required: [
          { name: 'search_knowledge', built_in: true, when_to_use: 'Retrieve chunks first.' },
          { name: 'update_ticket', effect_class: 'MUTATING', approval_requirement: 'REQUIRED' },
        ],
      },
      knowledge: { required: ['help-center'], notes: 'The approved corpus.' },
      channels: { channels: ['web-widget'], caps: { 'web-widget': { citation_links: true } } },
    },
    eval_ref: {
      evaluators: { evaluators: [{ name: 'policy-judge', version: '1.0.0', kind: 'llm-judge', checks: ['prompt_injection'] }] },
      rubric_markdown: '# Rubric',
      cases: [{ input: 'Hi', expected_behavior: 'Greet.' }],
    },
    release_policy: { release_policy_version: 1, required: ['safety_pass'], thresholds: { task_success: 0.9 }, critical_failures: ['prompt_injection'] },
    hash: 'a'.repeat(64),
    min_engine_schema: 1,
  },
  available: false,
  compatibility: {
    status: 'INCOMPATIBLE',
    reasons: [{ code: 'knowledge_source_missing', detail: 'no READY document for slug: help-center' }],
  },
  installed: true,
  update_available: 'minor',
};

describe('parseTemplateList', () => {
  it('reads registry entries with BOM detail intact', () => {
    const entries = parseTemplateList({ templates: [ENTRY] });
    expect(entries).toHaveLength(1);
    const [entry] = entries;
    expect(entry.template.slug).toBe('support-concierge');
    expect(entry.available).toBe(false);
    expect(entry.compatible).toBe(false);
    expect(entry.reasons).toEqual([{ code: 'knowledge_source_missing', detail: 'no READY document for slug: help-center' }]);
    expect(entry.installed).toBe(true);
    expect(entry.updateAvailable).toBe('minor');
    expect(entry.template.bindings.tools.required).toHaveLength(2);
    expect(entry.template.bindings.tools.required[0]).toMatchObject({ name: 'search_knowledge', built_in: true });
    expect(entry.template.bindings.knowledge.required).toEqual(['help-center']);
    expect(entry.template.bindings.channels.channels).toEqual(['web-widget']);
    expect(entry.template.evalRef?.rubric_markdown).toBe('# Rubric');
    expect(entry.template.releasePolicy?.critical_failures).toEqual(['prompt_injection']);
  });

  it('defaults compatibility honestly when absent', () => {
    const entries = parseTemplateList({ templates: [{ template: { slug: 'x' } }] });
    expect(entries[0].compatible).toBe(false);
    expect(entries[0].available).toBe(false);
    expect(entries[0].reasons).toEqual([]);
    expect(entries[0].updateAvailable).toBe('none');
  });

  it('drops entries without slugs and tolerates junk', () => {
    expect(parseTemplateList({ templates: [{ template: {} }, null] })).toEqual([]);
    expect(parseTemplateList(null)).toEqual([]);
  });

  it('reads live camelCase rows (C11 D2 — snake-only nulled these)', () => {
    const live = {
      template: {
        slug: 'support-concierge',
        version: '3.0.0',
        status: 'stable',
        family: 'support',
        definition: {},
        bindings: { tools: { required: [] }, knowledge: { required: [] }, channels: { channels: [] } },
        evalRef: { rubric_markdown: '# Live rubric' },
        releasePolicy: { release_policy_version: 3, required: ['safety_pass', { regression_no_worse_than: 0.02 }] },
        hash: 'b'.repeat(64),
        minEngineSchema: 2,
      },
      available: true,
      compatibility: { status: 'COMPATIBLE', reasons: [] },
      installed: false,
      update_available: 'none',
    };
    const entries = parseTemplateList({ templates: [live] });
    expect(entries).toHaveLength(1);
    expect(entries[0].template.evalRef?.rubric_markdown).toBe('# Live rubric');
    expect(entries[0].template.releasePolicy?.required).toEqual(['safety_pass', { regression_no_worse_than: 0.02 }]);
    expect(entries[0].template.minEngineSchema).toBe(2);
    expect(entries[0].compatible).toBe(true);
  });
});

describe('reasonFix', () => {
  it('links models/knowledge/credentials to live routes', () => {
    expect(reasonFix('required_model_capability_missing')).toMatchObject({ to: '/agent-studio/models' });
    expect(reasonFix('knowledge_source_missing')).toMatchObject({ to: '/agent-studio/knowledge' });
    expect(reasonFix('provider_credential_missing')).toMatchObject({ to: '/agent-studio/models' });
  });

  it('links tool pins to the live catalog (and install checklist)', () => {
    expect(reasonFix('required_tool_missing')).toMatchObject({ to: '/agent-studio/tools' });
    expect(reasonFix('something_new')).toBeNull();
  });
});
