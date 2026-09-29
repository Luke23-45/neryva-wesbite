import { describe, expect, it } from 'vitest';
import {
  parseConnectors,
  parseOAuthApps,
  parseSyncResult,
  buildConnectorConfig,
  singleFieldOverflowNote,
  validateCredentialShape,
  PROVIDER_LINK_SPECS,
  CONNECTOR_PROVIDERS,
} from './useSetupConnectors';

describe('connector provider specs', () => {
  it('covers exactly the engine provider ids', () => {
    expect(PROVIDER_LINK_SPECS.map((s) => s.provider).sort()).toEqual([...CONNECTOR_PROVIDERS].sort());
  });

  it('declares the sync-required config keys (verbatim engine keys)', () => {
    const keys = (provider: string): string[] =>
      PROVIDER_LINK_SPECS.find((s) => s.provider === provider)?.configFields.filter((f) => f.required).map((f) => f.key) ?? [];
    expect(keys('sitemap')).toEqual(['sitemap_url']);
    expect(keys('sharepoint')).toEqual(['drive_id']);
    expect(keys('confluence')).toEqual(['base_url']);
    expect(keys('zendesk')).toEqual(['subdomain']);
    expect(keys('google_drive')).toEqual([]);
    expect(keys('notion')).toEqual([]);
  });

  it('binds Drive via dance only (pasted secrets refused server-side)', () => {
    expect(PROVIDER_LINK_SPECS.find((s) => s.provider === 'google_drive')?.credentials).toBe('dance-only');
  });

  it('keeps the Zendesk locale field singular and honest (P1-decision)', () => {
    const fields = PROVIDER_LINK_SPECS.find((s) => s.provider === 'zendesk')?.configFields ?? [];
    const locale = fields.find((f) => f.key === 'locales');
    expect(locale).toMatchObject({ label: 'Locale (optional)', single: true });
    // The wire key stays `locales` (engine's asConfigStrings requires an
    // array under that key); only the input is singular.
    expect(locale?.key).toBe('locales');
  });
});

describe('buildConnectorConfig', () => {
  const zendesk = PROVIDER_LINK_SPECS.find((s) => s.provider === 'zendesk');
  const confluence = PROVIDER_LINK_SPECS.find((s) => s.provider === 'confluence');
  if (!zendesk || !confluence) {
    throw new Error('connector specs missing');
  }

  it('keeps only the first locale for Zendesk (engine narrows to locales[0])', () => {
    expect(buildConnectorConfig(zendesk, { subdomain: 'acme', locales: 'en-us, fr' })).toEqual({
      subdomain: 'acme',
      locales: ['en-us'],
    });
  });

  it('sends a single locale as a one-entry array (engine shape)', () => {
    expect(buildConnectorConfig(zendesk, { subdomain: 'acme', locales: 'en-us' })).toEqual({
      subdomain: 'acme',
      locales: ['en-us'],
    });
  });

  it('omits a blank locale (absent = all locales)', () => {
    expect(buildConnectorConfig(zendesk, { subdomain: 'acme', locales: '  ' })).toEqual({ subdomain: 'acme' });
  });

  it('keeps Confluence spaces as a real list (plural input is honest there)', () => {
    expect(buildConnectorConfig(confluence, { base_url: 'https://x.atlassian.net/wiki', spaces: 'ENG, DOCS' })).toEqual({
      base_url: 'https://x.atlassian.net/wiki',
      spaces: ['ENG', 'DOCS'],
    });
  });
});

describe('singleFieldOverflowNote', () => {
  const localeField = { label: 'Locale (optional)', single: true } as const;

  it('discloses the discarded extras when the field held multiples', () => {
    expect(singleFieldOverflowNote(localeField, 'en-us, fr, de')).toBe(
      'Only the first locale is used ("en-us") — the rest are discarded.',
    );
  });

  it('stays silent for a single value or blank input', () => {
    expect(singleFieldOverflowNote(localeField, 'en-us')).toBeNull();
    expect(singleFieldOverflowNote(localeField, '  ')).toBeNull();
  });

  it('stays silent for non-single fields even with commas', () => {
    expect(singleFieldOverflowNote({ label: 'Spaces (comma-separated keys, optional)' }, 'ENG, DOCS')).toBeNull();
  });
});

describe('parseConnectors', () => {
  it('reads account views with credential presence only (never sealed material)', () => {
    const rows = parseConnectors({
      connectors: [
        { id: 'a1', provider: 'sitemap', displayName: 'Docs', state: 'active', lastSyncedAt: '2026-09-16T10:00:00Z', lastError: null, hasCredentials: false },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'a1', provider: 'sitemap', hasCredentials: false });
    expect('credentialsSealed' in (rows[0] as unknown as Record<string, unknown>)).toBe(false);
  });

  it('drops rows without ids', () => {
    expect(parseConnectors({ connectors: [{ provider: 'x' }] })).toEqual([]);
  });
});

describe('parseSyncResult', () => {
  it('reads the sync envelope and defaults zeros', () => {
    expect(parseSyncResult({ sync: { synced: 3, truncated: true, skipped: 1, tombstoned: 2 } })).toEqual({
      synced: 3,
      truncated: true,
      skipped: 1,
      tombstoned: 2,
    });
    expect(parseSyncResult({})).toEqual({ synced: 0, truncated: false, skipped: 0, tombstoned: 0 });
  });
});

describe('parseOAuthApps', () => {
  it('reads apps without secrets', () => {
    const apps = parseOAuthApps({ apps: [{ provider: 'google_drive', client_id: 'cid' }] });
    expect(apps).toEqual([{ provider: 'google_drive', clientId: 'cid', createdAt: null, updatedAt: null }]);
  });
});

describe('validateCredentialShape (I14/I15)', () => {
  const confluence = PROVIDER_LINK_SPECS.find((s) => s.provider === 'confluence');
  const zendesk = PROVIDER_LINK_SPECS.find((s) => s.provider === 'zendesk');
  if (!confluence || !zendesk) {
    throw new Error('connector specs missing');
  }

  it('documents the engine credential format in the hint', () => {
    expect(confluence.credentialsHint).toContain('email:api_token');
    expect(zendesk.credentialsHint).toContain('email/api_token');
  });

  it('accepts a properly formatted confluence secret', () => {
    expect(validateCredentialShape(confluence, 'you@company.com:ATATT3xFf...token')).toBeNull();
  });

  it('blocks a token-only confluence paste (guaranteed 401 at sync)', () => {
    const problem = validateCredentialShape(confluence, 'ATATT3xFf...token');
    expect(problem).toContain('email:api_token');
    expect(problem).toContain('401');
  });

  it('accepts a properly formatted zendesk secret', () => {
    expect(validateCredentialShape(zendesk, 'you@company.com/zd_api_token')).toBeNull();
  });

  it('blocks a token-only zendesk paste (guaranteed 401 at sync)', () => {
    const problem = validateCredentialShape(zendesk, 'zd_api_token');
    expect(problem).toContain('email/api_token');
    expect(problem).toContain('401');
  });

  it('does not flag blank input (requiredness is checked separately)', () => {
    expect(validateCredentialShape(confluence, '   ')).toBeNull();
  });

  it('is a no-op for providers without a documented shape', () => {
    const notion = PROVIDER_LINK_SPECS.find((s) => s.provider === 'notion');
    if (!notion) {
      throw new Error('notion spec missing');
    }
    expect(notion.credentialShape).toBeUndefined();
    expect(validateCredentialShape(notion, 'anything')).toBeNull();
  });
});
