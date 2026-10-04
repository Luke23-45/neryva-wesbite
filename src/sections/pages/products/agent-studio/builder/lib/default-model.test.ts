/**
 * pickDefaultRow — targeted coverage of the org-default matching rules:
 * platform preference, unusable exclusion, unknown-model fallback to null,
 * null default → null.
 */
import { describe, expect, it } from 'vitest';
import { pickDefaultRow } from './default-model';
import type { BuilderModelRow } from './useGroupedModels';

function row(overrides: Partial<BuilderModelRow>): BuilderModelRow {
  return {
    key: 'platform|openai/gpt-4o-mini|',
    supergroup: 'platform',
    provider: 'openai',
    providerDisplayName: 'OpenAI',
    credentialId: null,
    credentialLabel: null,
    modelId: 'gpt-4o-mini',
    ref: 'openai/gpt-4o-mini',
    displayName: 'GPT-4o mini',
    usable: true,
    enabled: true,
    reasons: [],
    capabilities: { tools: true, vision: false, reasoning: false, structured_output: false },
    requiredProduct: null,
    requiredProductLabel: null,
    pinnedBy: [],
    contextWindowTokens: null,
    ...overrides,
  };
}

const DEF = { provider: 'openai', model_id: 'gpt-4o-mini' };

describe('pickDefaultRow', () => {
  it('matches the platform row for the default ref', () => {
    const rows = [row({}), row({ ref: 'openai/gpt-4o', modelId: 'gpt-4o', displayName: 'GPT-4o' })];
    expect(pickDefaultRow(rows, DEF)?.ref).toBe('openai/gpt-4o-mini');
  });

  it('prefers the platform row when a BYOK key serves the same model', () => {
    const byok = row({
      key: 'byok|openai/gpt-4o-mini|cred-1',
      supergroup: 'byok',
      credentialId: 'cred-1',
      credentialLabel: 'Production Key',
    });
    const platform = row({});
    // Order-independent: platform wins regardless of list order.
    expect(pickDefaultRow([byok, platform], DEF)?.credentialId).toBeNull();
    expect(pickDefaultRow([platform, byok], DEF)?.credentialId).toBeNull();
  });

  it('falls back to the BYOK row when the platform row is unusable', () => {
    const rows = [
      row({ usable: false, reasons: ['model_disabled_by_org'] }),
      row({
        key: 'byok|openai/gpt-4o-mini|cred-1',
        supergroup: 'byok',
        credentialId: 'cred-1',
        credentialLabel: 'Production Key',
      }),
    ];
    expect(pickDefaultRow(rows, DEF)?.credentialId).toBe('cred-1');
  });

  it('returns null when the default model is not in the available list', () => {
    const rows = [row({ provider: 'anthropic', modelId: 'claude-3-7-sonnet', ref: 'anthropic/claude-3-7-sonnet' })];
    expect(pickDefaultRow(rows, { provider: 'openai', model_id: 'gpt-5' })).toBeNull();
  });

  it('returns null when the only matching row is unusable', () => {
    const rows = [row({ usable: false, reasons: ['subscription_required'] })];
    expect(pickDefaultRow(rows, DEF)).toBeNull();
  });

  it('returns null for a null or undefined default', () => {
    expect(pickDefaultRow([row({})], null)).toBeNull();
    expect(pickDefaultRow([row({})], undefined)).toBeNull();
  });
});
