import { describe, expect, it, vi } from 'vitest';
import {
  parseChannels,
  parseChannel,
  widgetSnippet,
  widgetSnippetOrigin,
  normalizeOriginEntry,
  validateCredentialField,
  buildChannelExtrasPatch,
  outOfWindowTemplateProblem,
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

  it('warns (never silently) when dropping malformed rows — P5-C7', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(parseChannels({ channels: [{ platform: 'web' }, null, 42] })).toEqual([]);
      expect(warn).toHaveBeenCalledTimes(3);
      expect(warn.mock.calls[0][0]).toContain('without id');
      expect(warn.mock.calls[1][0]).toContain('non-object row');
    } finally {
      warn.mockRestore();
    }
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

describe('normalizeOriginEntry (H5)', () => {
  it('keeps a bare origin untouched', () => {
    expect(normalizeOriginEntry('https://acme.com')).toBe('https://acme.com');
  });

  it('strips the path so the engine allowlist check passes', () => {
    expect(normalizeOriginEntry('https://acme.com/docs')).toBe('https://acme.com');
    expect(normalizeOriginEntry('https://acme.com/docs/?a=b#frag')).toBe('https://acme.com');
  });

  it('preserves an explicit port', () => {
    expect(normalizeOriginEntry('https://acme.com:8443/admin')).toBe('https://acme.com:8443');
  });

  it('strips a trailing slash and lowercases', () => {
    expect(normalizeOriginEntry('HTTPS://ACME.COM/')).toBe('https://acme.com');
  });

  it('passes unparseable entries through for the engine to fail closed', () => {
    expect(normalizeOriginEntry('not a url')).toBe('not a url');
    expect(normalizeOriginEntry('ftp://acme.com')).toBe('ftp://acme.com');
    expect(normalizeOriginEntry('')).toBe('');
  });
});

describe('validateCredentialField (H3)', () => {
  const appSecret = (platform: 'whatsapp' | 'messenger') =>
    PLATFORM_CREDENTIAL_SPECS.find((s) => s.platform === platform)?.fields.find((f) => f.key === 'app_secret');
  const botToken = () =>
    PLATFORM_CREDENTIAL_SPECS.find((s) => s.platform === 'telegram')?.fields.find((f) => f.key === 'bot_token');

  it('accepts a 64-hex app secret', () => {
    const field = appSecret('whatsapp');
    if (!field) throw new Error('whatsapp app_secret spec missing');
    expect(validateCredentialField(field, 'a'.repeat(64))).toBeNull();
    expect(validateCredentialField(field, 'A'.repeat(64))).toBeNull();
  });

  it('rejects a malformed app secret before the server round-trip', () => {
    const field = appSecret('messenger');
    if (!field) throw new Error('messenger app_secret spec missing');
    expect(validateCredentialField(field, 'tooshort')).toContain('64 hex');
    expect(validateCredentialField(field, 'g'.repeat(64))).toContain('64 hex');
  });

  it('accepts a well-formed bot token', () => {
    const field = botToken();
    if (!field) throw new Error('telegram bot_token spec missing');
    expect(validateCredentialField(field, '123456:AAH-token_here')).toBeNull();
  });

  it('rejects a malformed bot token before the server round-trip', () => {
    const field = botToken();
    if (!field) throw new Error('telegram bot_token spec missing');
    expect(validateCredentialField(field, 'no-colon-here')).toContain('123456:token');
  });

  it('does not flag blank input (requiredness is checked separately)', () => {
    const field = botToken();
    if (!field) throw new Error('telegram bot_token spec missing');
    expect(validateCredentialField(field, '  ')).toBeNull();
  });

  it('is a no-op for fields without a format (e.g. access_token)', () => {
    const field = PLATFORM_CREDENTIAL_SPECS.find((s) => s.platform === 'whatsapp')?.fields.find(
      (f) => f.key === 'access_token',
    );
    if (!field) throw new Error('whatsapp access_token spec missing');
    expect(field.format).toBeUndefined();
    expect(validateCredentialField(field, 'anything')).toBeNull();
  });
});

describe('buildChannelExtrasPatch (H13)', () => {
  const empty = {
    escalationNote: '',
    escalationResolvedNote: '',
    voiceRepliesEnabled: false,
    outOfWindowTemplateName: '',
    outOfWindowTemplateLanguage: '',
    outOfWindowNote: '',
  };

  it('sends nothing when nothing changed', () => {
    expect(buildChannelExtrasPatch('whatsapp', {}, empty)).toEqual({});
    expect(
      buildChannelExtrasPatch('whatsapp', { escalation_note: 'n', voice_replies_enabled: false }, {
        ...empty,
        escalationNote: 'n',
      }),
    ).toEqual({});
  });

  it('sends changed escalation notes (≤500) on every non-web platform', () => {
    for (const platform of ['whatsapp', 'messenger', 'telegram']) {
      const patch = buildChannelExtrasPatch(platform, {}, { ...empty, escalationNote: 'Hi, a human!' });
      expect(patch.escalation_note).toBe('Hi, a human!');
    }
  });

  it('sends null to clear a note, never an empty string', () => {
    const patch = buildChannelExtrasPatch('messenger', { escalation_note: 'old' }, empty);
    expect(patch.escalation_note).toBeNull();
  });

  it('gates voice replies to whatsapp and sends only on change', () => {
    expect(
      buildChannelExtrasPatch('whatsapp', {}, { ...empty, voiceRepliesEnabled: true }).voice_replies_enabled,
    ).toBe(true);
    expect(
      buildChannelExtrasPatch('telegram', {}, { ...empty, voiceRepliesEnabled: true }).voice_replies_enabled,
    ).toBeUndefined();
    expect(
      buildChannelExtrasPatch('whatsapp', { voice_replies_enabled: true }, { ...empty, voiceRepliesEnabled: true }),
    ).toEqual({});
  });

  it('sends the whatsapp out-of-window template only when both fields are set', () => {
    const patch = buildChannelExtrasPatch('whatsapp', {}, {
      ...empty,
      outOfWindowTemplateName: 'hello_world',
      outOfWindowTemplateLanguage: 'en_US',
    });
    expect(patch.out_of_window_template).toEqual({ name: 'hello_world', language: 'en_US' });
    // Clearing both removes the template via null (the engine drops it).
    const cleared = buildChannelExtrasPatch(
      'whatsapp',
      { out_of_window_template: { name: 'hello_world', language: 'en_US' } },
      empty,
    );
    expect(cleared.out_of_window_template).toBeNull();
  });

  it('keeps the out-of-window note messenger-only', () => {
    const patch = buildChannelExtrasPatch('messenger', {}, { ...empty, outOfWindowNote: 'We reply daily.' });
    expect(patch.out_of_window_note).toBe('We reply daily.');
    expect(
      buildChannelExtrasPatch('whatsapp', {}, { ...empty, outOfWindowNote: 'We reply daily.' }).out_of_window_note,
    ).toBeUndefined();
  });

  it('offers escalation notes on web too (the engine persists/consumes them with no platform gate)', () => {
    // G2: escalation notes are platform-agnostic in sanitizeConfig +
    // handleEscalationNote — the old `platform !== 'web'` gate was
    // console-stricter-than-engine. Voice/template/note stay gated.
    const patch = buildChannelExtrasPatch(
      'web',
      {},
      { ...empty, escalationNote: 'x', voiceRepliesEnabled: true },
    );
    expect(patch.escalation_note).toBe('x');
    expect(patch.voice_replies_enabled).toBeUndefined();
  });

  it('keeps voice replies and the out-of-window template whatsapp-only', () => {
    const patch = buildChannelExtrasPatch(
      'telegram',
      {},
      { ...empty, voiceRepliesEnabled: true, outOfWindowTemplateName: 'hello_world', outOfWindowTemplateLanguage: 'en_US' },
    );
    expect(patch.voice_replies_enabled).toBeUndefined();
    expect(patch.out_of_window_template).toBeUndefined();
  });

  it('never persists a half-filled out-of-window template (G3)', () => {
    const partial = (name: string, lang: string) =>
      buildChannelExtrasPatch(
        'whatsapp',
        {},
        { ...empty, outOfWindowTemplateName: name, outOfWindowTemplateLanguage: lang },
      );
    expect(partial('hello_world', '').out_of_window_template).toBeUndefined();
    expect(partial('', 'en_US').out_of_window_template).toBeUndefined();
    // Full template still persists; both-empty still clears.
    expect(partial('hello_world', 'en_US').out_of_window_template).toEqual({
      name: 'hello_world',
      language: 'en_US',
    });
    expect(
      buildChannelExtrasPatch(
        'whatsapp',
        { out_of_window_template: { name: 'hello_world', language: 'en_US' } },
        empty,
      ).out_of_window_template,
    ).toBeNull();
  });

  it('flags a half-filled out-of-window template before save (G3)', () => {
    expect(outOfWindowTemplateProblem({ outOfWindowTemplateName: 'hello_world', outOfWindowTemplateLanguage: '' })).toMatch(
      /both a name and a language/,
    );
    expect(outOfWindowTemplateProblem({ outOfWindowTemplateName: '', outOfWindowTemplateLanguage: 'en_US' })).not.toBeNull();
    expect(outOfWindowTemplateProblem({ outOfWindowTemplateName: 'hello_world', outOfWindowTemplateLanguage: 'en_US' })).toBeNull();
    expect(outOfWindowTemplateProblem({ outOfWindowTemplateName: '', outOfWindowTemplateLanguage: '' })).toBeNull();
    expect(outOfWindowTemplateProblem({ outOfWindowTemplateName: '  ', outOfWindowTemplateLanguage: 'en_US' })).not.toBeNull();
  });
});
