/**
 * Knowledge connectors (team_setup_ledger.md F-A5/A6/A8) over the EXACT
 * contract (`engine/src/modules/knowledge/connectors.controller.ts`,
 * `connectors.service.ts`, `connector-adapters.ts`, `connector.port.ts`):
 *
 * Providers: sitemap | google_drive | sharepoint | confluence | notion |
 * zendesk | slack. Link body {provider, display_name, config?, credentials?}
 * with per-provider credential rules (Drive = dance only, sitemap keyless,
 * sharepoint = msal-cc JSON, static providers = sealed secret ≥4 chars).
 * Sync on a non-active account returns zeros (NOT an error) — the UI must
 * say "resume to sync". Sealed material never appears in views
 * (hasCredentials only). OAuth callback lands opaque
 * (/platform/org/:orgId/connectors?oauth=connected|failed).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

const CONNECTORS_KEY = ['studio', 'setup', 'connectors'] as const;

export const CONNECTOR_PROVIDERS = ['sitemap', 'google_drive', 'sharepoint', 'confluence', 'notion', 'zendesk', 'slack'] as const;
export type ConnectorProvider = (typeof CONNECTOR_PROVIDERS)[number];

/**
 * Provider link sheet: config fields the adapters require at sync
 * (connector-adapters.ts / connector.port.ts — verbatim keys) + how auth
 * binds. `credentials` describes the link-time secret shape; `dance` means
 * tokens bind exclusively via OAuth after linking.
 *
 * One config input on the link sheet. `key` is the verbatim engine config
 * key (`connector-adapters.ts` / `connector.port.ts`).
 */
export interface ProviderConfigField {
  key: string;
  label: string;
  required: boolean;
  placeholder: string;
  hint: string;
  /**
   * Single-value field (P1-decision): the provider API takes one value, so
   * only the first comma-separated entry is kept at submit. The modal shows
   * an honest note when the field holds multiples — extras are disclosed as
   * discarded, never silently kept as a list the engine narrows to `[0]`
   * anyway. The wire key/shape is unchanged (e.g. `locales: string[]`,
   * which `asConfigStrings` requires to be an array).
   */
  single?: boolean;
}

/**
 * The exact secret shape the engine splits at sync time. A paste that lacks
 * the separator links fine but every sync fails with a 401 — so the console
 * documents the format in the hint AND blocks the link client-side when the
 * separator is missing. `format` mirrors the engine's auth split verbatim
 * (confluence: `secret.indexOf(':')`, zendesk: `secret.indexOf('/')`).
 */
export interface ProviderCredentialShape {
  separator: ':' | '/';
  /** Link-blocking error shown when the pasted secret lacks the separator. */
  missingMessage: string;
}

export interface ProviderLinkSpec {
  provider: ConnectorProvider;
  label: string;
  blurb: string;
  configFields: ProviderConfigField[];
  credentials: 'none' | 'dance-only' | 'msal-cc' | 'secret-required';
  credentialsHint: string;
  credentialShape?: ProviderCredentialShape;
}

/**
 * Client-side pre-validation for static secrets with a documented shape
 * (confluence / zendesk). Returns the link-blocking problem, or null when
 * the paste carries the required separator. Blank input is not a shape
 * problem — requiredness is checked separately.
 */
export function validateCredentialShape(spec: ProviderLinkSpec, raw: string): string | null {
  const shape = spec.credentialShape;
  if (!shape || !raw.trim()) {
    return null;
  }
  return raw.includes(shape.separator) ? null : shape.missingMessage;
}

export const PROVIDER_LINK_SPECS: readonly ProviderLinkSpec[] = [
  {
    provider: 'sitemap',
    label: 'Sitemap',
    blurb: 'Crawl a public sitemap.xml — no auth. Incremental via lastmod cursor.',
    configFields: [{ key: 'sitemap_url', label: 'Sitemap URL', required: true, placeholder: 'https://docs.company.com/sitemap.xml', hint: 'Required at sync (config.sitemap_url).' }],
    credentials: 'none',
    credentialsHint: 'No credentials — public content only.',
  },
  {
    provider: 'google_drive',
    label: 'Google Drive',
    blurb: 'Whole-drive enumeration with changes cursor. Tokens bind via OAuth only.',
    configFields: [],
    credentials: 'dance-only',
    credentialsHint: 'Link without credentials, then run the OAuth dance — pasted secrets are refused.',
  },
  {
    provider: 'sharepoint',
    label: 'SharePoint',
    blurb: 'Document-library sync via Entra client-credentials (msal-cc bundle).',
    configFields: [{ key: 'drive_id', label: 'Drive ID', required: true, placeholder: 'Document library drive id', hint: 'Required at sync (config.drive_id).' }],
    credentials: 'msal-cc',
    credentialsHint: 'Paste the msal-cc JSON bundle {client_id, tenant, secret} — secret ≥ 8 chars.',
  },
  {
    provider: 'confluence',
    label: 'Confluence',
    blurb: 'Space sync with restriction capture. Needs the wiki base URL.',
    configFields: [
      { key: 'base_url', label: 'Base URL', required: true, placeholder: 'https://<site>.atlassian.net/wiki', hint: 'Required at sync (config.base_url).' },
      { key: 'spaces', label: 'Spaces (comma-separated keys, optional)', required: false, placeholder: 'ENG, DOCS', hint: 'Omit to sync all visible spaces.' },
    ],
    credentials: 'secret-required',
    credentialsHint:
      'Paste as email:api_token — e.g. you@company.com:api_token. Sealed on arrival, never shown again. A bare token links fine but every sync fails with a 401.',
    // I14: the engine splits the stored secret on the first ':' —
    // token-only pastes degrade to Basic base64(':token'), which Confluence
    // rejects. Block at link time with the format guidance.
    credentialShape: {
      separator: ':',
      missingMessage:
        'Confluence expects "email:api_token" — your Atlassian email, a colon, then the API token. A bare token links fine but every sync fails with a 401.',
    },
  },
  {
    provider: 'notion',
    label: 'Notion',
    blurb: 'Workspace search sync under the integration token’s scope (Notion exposes no per-page ACL — recorded open).',
    configFields: [],
    credentials: 'secret-required',
    credentialsHint: 'Internal integration token — sealed on arrival, never shown again.',
  },
  {
    provider: 'zendesk',
    label: 'Zendesk',
    blurb: 'Help-center sync with segment capture.',
    configFields: [
      { key: 'subdomain', label: 'Subdomain', required: true, placeholder: 'company', hint: 'Required at sync (config.subdomain).' },
      // P1-decision: singular and honest — Zendesk's API takes a single
      // locale (engine uses locales[0]); the wire key stays `locales` as a
      // one-entry array because asConfigStrings requires an array.
      { key: 'locales', label: 'Locale (optional)', required: false, placeholder: 'en-us', hint: 'Zendesk syncs a single locale — omit for all locales.', single: true },
    ],
    credentials: 'secret-required',
    credentialsHint:
      'Paste as email/api_token — e.g. you@company.com/api_token. Sealed on arrival, never shown again. A bare token links fine but every sync fails with a 401.',
    // I15: the engine splits the stored secret on the first '/' —
    // token-only pastes degrade to Basic base64('/token:secret'), which
    // Zendesk rejects. Block at link time with the format guidance.
    credentialShape: {
      separator: '/',
      missingMessage:
        'Zendesk expects "email/api_token" — your email, a slash, then the API token. A bare token links fine but every sync fails with a 401.',
    },
  },
  {
    provider: 'slack',
    label: 'Slack',
    blurb: 'Shared-file sync (public-share verdicts captured).',
    configFields: [{ key: 'file_types', label: 'File types (optional)', required: false, placeholder: 'text,pdf,docs', hint: 'Defaults to text,pdf,docs.' }],
    credentials: 'secret-required',
    credentialsHint: 'Bot token (xoxb-…) — sealed on arrival, never shown again.',
  },
];

/**
 * Builds the link-body config from the modal's string values (pure, so the
 * mapping is unit-testable and never hand-waved in JSX).
 * - `single` fields keep only the first comma-separated entry (Zendesk's API
 *   takes one locale). Extras are disclosed by `singleFieldOverflowNote`,
 *   never silently kept as a list the engine narrows to `[0]` anyway. The
 *   wire key/shape is unchanged (e.g. `locales: ['en-us']`).
 * - list fields (`spaces`) split on commas, as before.
 * - blank values are omitted (absent = provider default).
 */
export function buildConnectorConfig(spec: ProviderLinkSpec, values: Record<string, string>): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  for (const field of spec.configFields) {
    const value = values[field.key]?.trim();
    if (!value) {
      continue;
    }
    if (field.single) {
      const first = value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)[0];
      if (first) {
        config[field.key] = [first];
      }
      continue;
    }
    config[field.key] = field.key === 'spaces' ? value.split(',').map((s) => s.trim()).filter(Boolean) : value;
  }
  return config;
}

/**
 * Honest note when a `single` field holds multiple comma-separated values —
 * the extras are discarded at submit (P1-decision), so the UI states it up
 * front instead of silently dropping them. Returns null otherwise.
 */
export function singleFieldOverflowNote(field: Pick<ProviderConfigField, 'label' | 'single'>, value: string): string | null {
  if (!field.single) {
    return null;
  }
  const parts = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  const noun = field.label.replace(/\s*\([^)]*\)\s*$/, '').toLowerCase();
  return `Only the first ${noun} is used ("${parts[0]}") — the rest are discarded.`;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export interface ConnectorAccount {
  id: string;
  provider: string;
  displayName: string;
  state: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  hasCredentials: boolean;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function parseConnectors(raw: unknown): ConnectorAccount[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.connectors) ? record.connectors : [];
  return list
    .map((entry): ConnectorAccount | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      if (!id) {
        return null;
      }
      return {
        id,
        provider: str(item.provider) ?? 'unknown',
        displayName: str(item.displayName) ?? str(item.display_name) ?? 'Connector',
        state: str(item.state) ?? 'unknown',
        lastSyncedAt: str(item.lastSyncedAt) ?? str(item.last_synced_at),
        lastError: str(item.lastError) ?? str(item.last_error),
        hasCredentials: item.hasCredentials === true || item.has_credentials === true,
        createdBy: str(item.createdBy) ?? str(item.created_by),
        createdAt: str(item.createdAt) ?? str(item.created_at),
        updatedAt: str(item.updatedAt) ?? str(item.updated_at),
      };
    })
    .filter((c): c is ConnectorAccount => c !== null);
}

export function useConnectors(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CONNECTORS_KEY, orgId, 'list'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/connectors`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 15_000,
    select: parseConnectors,
  });
}

export interface LinkConnectorInput {
  provider: string;
  displayName: string;
  config: Record<string, unknown>;
  credentials?: string;
}

export function useLinkConnector() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LinkConnectorInput) =>
      engine(`/console/org/${orgId}/connectors`, {
        method: 'POST',
        body: {
          provider: input.provider,
          display_name: input.displayName,
          config: input.config,
          ...(input.credentials !== undefined ? { credentials: input.credentials } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...CONNECTORS_KEY, orgId] }),
    onError: (error) => toastEngineError(error, 'Could not link the connector'),
  });
}

export function useSetConnectorState() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { accountId: string; state: 'active' | 'paused' }) =>
      engine(`/console/org/${orgId}/connectors/${input.accountId}/state`, {
        method: 'POST',
        body: { state: input.state },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...CONNECTORS_KEY, orgId] }),
    onError: (error) => toastEngineError(error, 'Could not change the connector state'),
  });
}

export interface SyncResult {
  synced: number;
  truncated: boolean;
  skipped: number;
  tombstoned: number;
}

export function parseSyncResult(raw: unknown): SyncResult {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const inner = typeof record.sync === 'object' && record.sync !== null ? (record.sync as Record<string, unknown>) : record;
  const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
  return {
    synced: num(inner.synced),
    truncated: inner.truncated === true,
    skipped: num(inner.skipped),
    tombstoned: num(inner.tombstoned),
  };
}

export function useSyncConnector() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const raw = await engine<unknown>(`/console/org/${orgId}/connectors/${accountId}/sync`, { method: 'POST', idempotent: true });
      return parseSyncResult(raw);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...CONNECTORS_KEY, orgId] }),
    onError: (error) => toastEngineError(error, 'Could not sync the connector'),
  });
}

export interface OAuthApp {
  provider: string;
  clientId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function parseOAuthApps(raw: unknown): OAuthApp[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.apps) ? record.apps : [];
  return list
    .map((entry): OAuthApp | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const provider = str(item.provider);
      if (!provider) {
        return null;
      }
      return {
        provider,
        clientId: str(item.clientId) ?? str(item.client_id),
        createdAt: str(item.createdAt) ?? str(item.created_at),
        updatedAt: str(item.updatedAt) ?? str(item.updated_at),
      };
    })
    .filter((a): a is OAuthApp => a !== null);
}

/** Per-tenant OAuth apps (owner/admin). Secrets are write-only — reads never carry them. */
export function useOAuthApps(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CONNECTORS_KEY, orgId, 'oauth-apps'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/connectors/oauth-apps`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 30_000,
    select: parseOAuthApps,
  });
}

export function useCreateOAuthApp() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { provider: string; clientId: string; clientSecret: string }) =>
      engine(`/console/org/${orgId}/connectors/oauth-apps`, {
        method: 'POST',
        body: { provider: input.provider, client_id: input.clientId, client_secret: input.clientSecret },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...CONNECTORS_KEY, orgId, 'oauth-apps'] }),
    onError: (error) => toastEngineError(error, 'Could not register the OAuth app'),
  });
}

export function useDeleteOAuthApp() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (provider: string) => engine(`/console/org/${orgId}/connectors/oauth-apps/${provider}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...CONNECTORS_KEY, orgId, 'oauth-apps'] }),
    onError: (error) => toastEngineError(error, 'Could not delete the OAuth app'),
  });
}

/** Starts the dance: returns the provider authorize URL — the frontend redirects the full page there. */
export function useOAuthAuthorize() {  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (accountId: string) =>
      engine<Record<string, unknown>>(`/console/org/${orgId}/connectors/${accountId}/oauth/authorize`, { method: 'POST' }),
    onError: (error) => toastEngineError(error, 'Could not start the OAuth dance'),
  });
}
