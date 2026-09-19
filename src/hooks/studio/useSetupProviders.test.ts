import { describe, expect, it } from 'vitest';
import { parseProviderCredentials, parseProviderEnablements, MODEL_PROVIDERS } from './useSetupProviders';

describe('provider vocabulary', () => {
  it('matches the engine closed vocabulary', () => {
    expect([...MODEL_PROVIDERS].sort()).toEqual(
      ['openai', 'anthropic', 'google', 'azure-openai', 'amazon-bedrock', 'mistral', 'xai', 'deepseek', 'openrouter', 'ollama'].sort(),
    );
  });
});

describe('parseProviderCredentials', () => {
  it('reads fingerprint-only views (never sealed material)', () => {
    const rows = parseProviderCredentials({
      credentials: [
        { id: 'k1', provider: 'anthropic', label: 'prod', external_ref: 'k-abc', source: 'byok', status: 'active', secret_fingerprint: '****4242' },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'k1', secretFingerprint: '****4242' });
    expect('secret' in (rows[0] as unknown as Record<string, unknown>)).toBe(false);
    expect('secretSealed' in (rows[0] as unknown as Record<string, unknown>)).toBe(false);
  });

  it('drops rows without ids', () => {
    expect(parseProviderCredentials({ credentials: [{ provider: 'x' }] })).toEqual([]);
  });

  it('carries P6 incident fields when present, tolerates their absence', () => {
    const rows = parseProviderCredentials({
      credentials: [
        { id: 'k1', provider: 'deepseek', label: 'backup', revocation_reason: 'leaked in logs', compromised: true, revoked_at: '2026-09-14T00:00:00Z' },
        { id: 'k2', provider: 'openai', label: 'prod' },
      ],
    });
    expect(rows[0]).toMatchObject({ revocationReason: 'leaked in logs', compromised: true });
    expect(rows[1]).toMatchObject({ revocationReason: null, compromised: false });
  });
});

describe('parseProviderEnablements', () => {
  it('reads enablements, defaulting missing flags to on', () => {
    const rows = parseProviderEnablements({ enablements: [{ provider: 'anthropic', enabled: false }] });
    expect(rows).toEqual([{ provider: 'anthropic', enabled: false, updatedBy: null, updatedAt: null }]);
  });

  it('tolerates junk', () => {
    expect(parseProviderEnablements({ enablements: [{ enabled: true }] })).toEqual([]);
  });
});
