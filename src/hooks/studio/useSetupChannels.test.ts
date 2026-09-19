import { describe, expect, it, vi } from 'vitest';
import {
  parseChannels,
  parseChannel,
  widgetSnippet,
  widgetSnippetOrigin,
  PLATFORM_CREDENTIAL_SPECS,
  CONNECTABLE_PLATFORMS,
} from './useSetupChannels';

describe('channel provider specs', () => {
  it('covers exactly the credentialable platforms (instagram/x/email listed but unsupported)', () => {
    expect([...CONNECTABLE_PLATFORMS].sort()).toEqual(['messenger', 'telegram', 'web', 'whatsapp'].sort());
    expect(PLATFORM_CREDENTIAL_SPECS.map((s) => s.platform).sort()).toEqual([...CONNECTABLE_PLATFORMS].sort());
  });

  it('declares the engine credential shapes (verbatim keys)', () => {
    const keys = (platform: string): string[] =>
      PLATFORM_CREDENTIAL_SPECS.find((s) => s.platform === platform)?.fields.map((f) => f.key) ?? [];
    expect(keys('whatsapp')).toEqual(['app_secret', 'access_token', 'phone_number_id']);
    expect(keys('messenger')).toEqual(['app_secret', 'access_token']);
    expect(keys('telegram')).toEqual(['bot_token']);
    expect(keys('web')).toEqual([]);
  });
});

describe('parseChannels', () => {
  it('reads public views with sealed material absent by construction', () => {
    const rows = parseChannels({
      channels: [
        { id: 'c1', platform: 'web', display_name: 'Site', public_key: 'nk_live_abc', status: 'active', health: { ok: true }, config: { default_assistant_id: 'a1' } },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'c1', platform: 'web', publicKey: 'nk_live_abc', status: 'active' });
    expect(rows[0].config).toMatchObject({ default_assistant_id: 'a1' });
    expect('credentialsSealed' in (rows[0] as unknown as Record<string, unknown>)).toBe(false);
  });

  it('reads single-channel envelopes and drops rows without ids', () => {
    expect(parseChannel({ channel: { id: 'c2', platform: 'telegram' } })?.id).toBe('c2');
    expect(parseChannel({ channel: null })).toBeNull();
    expect(parseChannels({ channels: [{ platform: 'web' }] })).toEqual([]);
  });
});

describe('widgetSnippet', () => {
  it('composes the verified loader contract (absolute URL + loader path + data-key)', () => {
    vi.stubGlobal('window', { location: { origin: 'https://console.test' } });
    expect(widgetSnippetOrigin()).toContain('https://console.test');
    const snippet = widgetSnippet('nk_live_abc');
    expect(snippet.startsWith('<script src="https://')).toBe(true);
    expect(snippet).toContain('/public/channels/widget/v1/neryva.js');
    expect(snippet).toContain('data-key="nk_live_abc"');
    vi.unstubAllGlobals();
  });
});
