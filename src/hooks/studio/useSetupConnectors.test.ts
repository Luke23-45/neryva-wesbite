import { describe, expect, it } from 'vitest';
import { parseConnectors, parseOAuthApps, parseSyncResult, PROVIDER_LINK_SPECS, CONNECTOR_PROVIDERS } from './useSetupConnectors';

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
