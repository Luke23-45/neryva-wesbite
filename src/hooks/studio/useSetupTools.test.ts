import { describe, expect, it } from 'vitest';
import { parseToolCatalog, parseToolTemplates, TOOL_NAME_PATTERN, BUILT_IN_TOOLS } from './useSetupTools';

describe('parseToolCatalog', () => {
  it('reads catalog rows with effect/approval/hash (never sealed credentials)', () => {
    const rows = parseToolCatalog({
      tools: [
        { id: 't1', name: 'lookup_ticket', version: '1.2.0', effect_class: 'READ_ONLY', approval_requirement: 'NONE', hash: 'h'.repeat(64), enabled: true, credentialSealed: 'enc:v1:secret' },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'lookup_ticket', effectClass: 'READ_ONLY', approvalRequirement: 'NONE', enabled: true });
    expect('credentialSealed' in (rows[0] as unknown as Record<string, unknown>)).toBe(false);
    expect('credential_sealed' in (rows[0] as unknown as Record<string, unknown>)).toBe(false);
  });

  it('carries the P4 perimeter with a client-derived binding host', () => {
    const rows = parseToolCatalog({
      tools: [
        {
          id: 't2', name: 'refund_payment', version: '2.0.0', effect_class: 'DESTRUCTIVE', approval_requirement: 'REQUIRED',
          hash: 'a'.repeat(64), enabled: true, executionEnvironment: 'external_gateway',
          allowedEgressDomains: ['pay.example', 'vault.example'],
          httpBinding: { url: 'https://pay.example/v1/charge' },
        },
        { id: 't3', name: 'local_compute', execution_environment: 'in_process', allowed_egress_domains: null, http_binding: null },
      ],
    });
    expect(rows[0]).toMatchObject({
      executionEnvironment: 'external_gateway',
      allowedEgressDomains: ['pay.example', 'vault.example'],
      bindingHost: 'pay.example',
    });
    expect(rows[1]).toMatchObject({ executionEnvironment: 'in_process', allowedEgressDomains: null, bindingHost: null });
  });

  it('degrades absent perimeter to nulls, never inventions', () => {
    const rows = parseToolCatalog({ tools: [{ id: 't4', name: 'old_row' }] });
    expect(rows[0]).toMatchObject({ executionEnvironment: null, allowedEgressDomains: null, bindingHost: null });
  });

  it('drops rows without names', () => {
    expect(parseToolCatalog({ tools: [{ version: '1.0.0' }] })).toEqual([]);
  });
});

describe('parseToolTemplates', () => {
  it('reads the prebuilt directory', () => {
    const rows = parseToolTemplates({ templates: [{ id: 'slack_post_message', name: 'slack_post_message', effect_class: 'MUTATING' }] });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'slack_post_message', effectClass: 'MUTATING' });
  });
});

describe('tool name contract', () => {
  it('matches the engine NAME_PATTERN (letter first, 2–64)', () => {
    expect(TOOL_NAME_PATTERN.test('lookup_ticket')).toBe(true);
    expect(TOOL_NAME_PATTERN.test('1tool')).toBe(false);
    expect(TOOL_NAME_PATTERN.test('a')).toBe(false);
    expect(TOOL_NAME_PATTERN.test('Bad-Name')).toBe(false);
  });

  it('covers the five publish-exempt built-ins', () => {
    expect([...BUILT_IN_TOOLS].sort()).toEqual(['generate_image', 'request_human_handoff', 'search_knowledge', 'search_memory', 'web_search'].sort());
  });
});
