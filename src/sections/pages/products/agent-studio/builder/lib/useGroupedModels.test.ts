import { describe, expect, it } from 'vitest';
import { pipelineEntryKey } from './entry-key';
import { flattenGroupedModels } from './useGroupedModels';

describe('pipelineEntryKey', () => {
  it('keys unpinned entries as platform (null credential_id = platform pool, PRV-024)', () => {
    expect(pipelineEntryKey('openai/gpt-4o', null)).toBe('platform|openai/gpt-4o|');
    expect(pipelineEntryKey('openai/gpt-4o', undefined)).toBe('platform|openai/gpt-4o|');
  });

  it('keys pinned entries as byok with the credential uuid', () => {
    expect(pipelineEntryKey('openai/gpt-4o', 'cred-uuid-1')).toBe('byok|openai/gpt-4o|cred-uuid-1');
  });

  it('distinguishes the same model from both sources', () => {
    expect(pipelineEntryKey('openai/gpt-4o', null)).not.toBe(
      pipelineEntryKey('openai/gpt-4o', 'cred-uuid-1')
    );
  });
});

function platformGroup() {
  return {
    provider: 'openai',
    provider_display_name: 'OpenAI',
    models: [
      {
        model_id: 'gpt-4o',
        display_name: 'GPT-4o',
        required_product: 'payg' as const,
        required_product_label: 'Pay as you go',
        enabled: true,
        usable: true,
        reasons: [],
        capabilities: { tools: true, vision: true, reasoning: false, structured_output: true },
        pricing: { input_per_1m: '2.50', output_per_1m: '10.00' },
        pinned_by: [{ assistant_id: 'asst-1', version: 3 }],
      },
      {
        model_id: 'o1',
        display_name: 'o1',
        required_product: 'enterprise' as const,
        required_product_label: 'Enterprise',
        enabled: false,
        usable: false,
        reasons: ['model_disabled_by_org'],
        capabilities: { tools: false, vision: false, reasoning: true, structured_output: false },
        pinned_by: [],
      },
    ],
  };
}

function byokGroup() {
  return {
    provider: 'openai',
    provider_display_name: 'OpenAI',
    credential_id: 'cred-uuid-1',
    credential_label: 'Production Key',
    credential_fingerprint: 'fp:ab12cd34',
    models: [
      {
        model_id: 'gpt-4o',
        display_name: 'GPT-4o',
        required_product: 'enterprise' as const,
        required_product_label: 'Enterprise',
        enabled: true,
        usable: true,
        reasons: [],
        capabilities: { tools: true, vision: true, reasoning: false, structured_output: false },
        pinned_by: [{ assistant_id: 'asst-2', version: 7 }],
      },
    ],
  };
}

describe('flattenGroupedModels', () => {
  it('flattens platform and byok groups with supergroup + credential identity', () => {
    const rows = flattenGroupedModels({ platform: [platformGroup()], byok: [byokGroup()] });
    expect(rows).toHaveLength(3);

    const platformRow = rows.find(r => r.key === 'platform|openai/gpt-4o|')!;
    expect(platformRow.supergroup).toBe('platform');
    expect(platformRow.credentialId).toBeNull();
    expect(platformRow.credentialLabel).toBeNull();
    expect(platformRow.ref).toBe('openai/gpt-4o');
    expect(platformRow.usable).toBe(true);
    expect(platformRow.pinnedBy).toEqual([{ assistant_id: 'asst-1', version: 3 }]);
    expect(platformRow.pricing).toEqual({ input_per_1m: '2.50', output_per_1m: '10.00' });

    const byokRow = rows.find(r => r.key === 'byok|openai/gpt-4o|cred-uuid-1')!;
    expect(byokRow.supergroup).toBe('byok');
    expect(byokRow.credentialId).toBe('cred-uuid-1');
    expect(byokRow.credentialLabel).toBe('Production Key');
    expect(byokRow.pinnedBy).toEqual([{ assistant_id: 'asst-2', version: 7 }]);
  });

  it('renders the same model from both sources as two distinct rows', () => {
    const rows = flattenGroupedModels({ platform: [platformGroup()], byok: [byokGroup()] });
    const gpt4o = rows.filter(r => r.ref === 'openai/gpt-4o');
    expect(gpt4o).toHaveLength(2);
    expect(new Set(gpt4o.map(r => r.key)).size).toBe(2);
  });

  it('carries toggle state and reasons (model_disabled_by_org)', () => {
    const rows = flattenGroupedModels({ platform: [platformGroup()], byok: [] });
    const o1 = rows.find(r => r.modelId === 'o1')!;
    expect(o1.enabled).toBe(false);
    expect(o1.usable).toBe(false);
    expect(o1.reasons).toEqual(['model_disabled_by_org']);
  });

  it('never surfaces credential fingerprints in builder rows', () => {
    const rows = flattenGroupedModels({ platform: [], byok: [byokGroup()] });
    expect(rows[0]).not.toHaveProperty('credential_fingerprint');
    expect(rows[0]).not.toHaveProperty('credentialFingerprint');
    expect(JSON.stringify(rows[0])).not.toContain('ab12cd34');
  });

  it('enriches contextWindowTokens from the /models read without guessing', () => {
    const ctx = new Map<string, number | null>([['openai/gpt-4o', 128000]]);
    const rows = flattenGroupedModels({ platform: [platformGroup()], byok: [byokGroup()] }, ctx);
    // Both supergroup rows share the provider/model ctx (display-only enrichment).
    expect(rows.find(r => r.key === 'platform|openai/gpt-4o|')!.contextWindowTokens).toBe(128000);
    expect(rows.find(r => r.key === 'byok|openai/gpt-4o|cred-uuid-1')!.contextWindowTokens).toBe(
      128000
    );
    // Unknown ctx renders as null, never invented.
    expect(rows.find(r => r.modelId === 'o1')!.contextWindowTokens).toBeNull();
  });

  it('handles empty groups', () => {
    expect(flattenGroupedModels({ platform: [], byok: [] })).toEqual([]);
  });
});
