import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Plug, ArrowRight, Pause, Play, RefreshCw, KeyRound, Trash2 } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { ActionButton } from '@components/common/ui/ActionButton';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import {
  useConnectors,
  useLinkConnector,
  useSetConnectorState,
  useSyncConnector,
  useOAuthApps,
  useCreateOAuthApp,
  useDeleteOAuthApp,
  useOAuthAuthorize,
  PROVIDER_LINK_SPECS,
  type ConnectorProvider,
  type SyncResult,
} from '@hooks/studio/useSetupConnectors';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';

import {
  Grid,
  Card,
  CardHead,
  Icon,
  CardName,
  CardCategory,
  CardDescription,
  CardFoot,
  StatusText,
  PanelCopy,
} from './IntegrationsView.styles';

// Only google_drive has OAuth dance metadata server-side
// (connector-oauth.ts OAUTH_PROVIDER_META) — the dance button renders for
// Drive accounts only; the server 422s any other provider.
const DANCE_PROVIDERS: readonly string[] = ['google_drive'];

const stateTone: Record<string, StatusTone> = {
  active: 'success',
  paused: 'warning',
  error: 'error',
};

const Muted = styled.span`
  opacity: 0.55;
`;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const RowActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
`;

const IconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

const SectionGap = styled.div`
  margin-top: 18px;
`;

const SyncResultBox = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 12px;
  font-size: 13px;
`;

export function IntegrationsView() {
  const { role } = useOrg();
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');

  const connectors = useConnectors();
  const link = useLinkConnector();
  const setState = useSetConnectorState();
  const sync = useSyncConnector();
  const authorize = useOAuthAuthorize();
  const apps = useOAuthApps({ enabled: canGovern });
  const createApp = useCreateOAuthApp();
  const deleteApp = useDeleteOAuthApp();

  const [linkProvider, setLinkProvider] = useState<ConnectorProvider | null>(null);
  const [lastSync, setLastSync] = useState<{ account: string; result: SyncResult } | null>(null);
  const [appOpen, setAppOpen] = useState(false);

  const accounts = useMemo(() => connectors.data ?? [], [connectors.data]);
  const byProvider = useMemo(() => {
    const map = new Map<string, number>();
    for (const account of accounts) {
      map.set(account.provider, (map.get(account.provider) ?? 0) + 1);
    }
    return map;
  }, [accounts]);

  const runSync = (accountId: string, displayName: string, state: string) => {
    if (state !== 'active') {
      toast.error(`${displayName} is ${state} — resume it before syncing. Paused connectors report zeros, not work.`);
      return;
    }
    sync.mutate(accountId, {
      onSuccess: (result) => {
        setLastSync({ account: displayName, result });
        if (result.synced === 0 && result.skipped === 0 && result.tombstoned === 0) {
          toast('Sync finished with no changes.');
        } else {
          toast.success(`Synced ${result.synced} document${result.synced === 1 ? '' : 's'} (${result.skipped} skipped, ${result.tombstoned} tombstoned)`);
        }
      },
    });
  };

  const runDance = (accountId: string) => {
    authorize.mutate(accountId, {
      onSuccess: (data) => {
        const url = typeof data.authorize_url === 'string' ? data.authorize_url : typeof data.url === 'string' ? data.url : null;
        if (!url) {
          toast.error('The provider authorize URL came back empty — try again.');
          return;
        }
        // Full-page redirect: the provider must return to the engine
        // callback, which lands back on /platform/org/:orgId/connectors.
        window.location.href = url;
      },
    });
  };

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Integrations</ViewTitle>
        <ViewSubtitle>
          External sources synced into the knowledge pipeline — same ingestion, same retrieval, tombstones on source delete.
        </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Providers" subtitle="Link an account per source. Credentials seal on arrival and never render again.">
          <Grid>
            {PROVIDER_LINK_SPECS.map((spec, i) => (
              <Card key={spec.provider} as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={i + 2}>
                <CardHead>
                  <Icon $color="#94a3b8">
                    <Plug size={16} strokeWidth={1.7} aria-hidden="true" />
                  </Icon>
                  <div style={{ minWidth: 0 }}>
                    <CardName>{spec.label}</CardName>
                    <CardCategory>{byProvider.get(spec.provider) ?? 0} linked</CardCategory>
                  </div>
                </CardHead>
                <CardDescription>{spec.blurb}</CardDescription>
                <CardFoot>
                  <StatusText>{spec.credentials === 'dance-only' ? 'OAuth dance' : spec.credentials === 'none' ? 'Keyless' : 'Sealed secret'}</StatusText>
                  <ActionButton
                    size="sm"
                    variant="secondary"
                    disabled={!canWrite || link.isPending}
                    title={canWrite ? `Link a ${spec.label} account` : writeDenied}
                    onClick={() => setLinkProvider(spec.provider)}
                  >
                    Link
                  </ActionButton>
                </CardFoot>
              </Card>
            ))}
          </Grid>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={10}>
        <SectionGap>
          <Panel title="Linked accounts" subtitle="Pause/resume, manual sync, and the OAuth dance. Accounts have no delete — pause what you retire.">
            <QueryView
              query={connectors}
              isEmpty={(d) => d.length === 0}
              empty={{ title: 'No connectors linked', description: 'Link a provider above — synced content lands in Documents with ext- slugs.' }}
            >
              {(rows) => (
                <DataTable>
                  <DataHead>
                    <DataCell $w="24%">Account</DataCell>
                    <DataCell $w="14%">Provider</DataCell>
                    <DataCell $w="10%">State</DataCell>
                    <DataCell $w="12%">Credentials</DataCell>
                    <DataCell $w="16%">Last sync</DataCell>
                    <DataCell $w="24%" $align="right">Actions</DataCell>
                  </DataHead>
                  {rows.map((account) => (
                    <DataRow key={account.id} $interactive={false}>
                      <DataCell $w="24%">{account.displayName}</DataCell>
                      <DataCell $w="14%">
                        <Mono>{account.provider}</Mono>
                      </DataCell>
                      <DataCell $w="10%">
                        <StatusPill tone={stateTone[account.state] ?? 'neutral'}>{account.state}</StatusPill>
                      </DataCell>
                      <DataCell $w="12%">{account.hasCredentials ? 'sealed ✓' : <Muted>none</Muted>}</DataCell>
                      <DataCell $w="16%">
                        {account.lastSyncedAt ? (
                          account.lastSyncedAt.slice(0, 16).replace('T', ' ')
                        ) : (
                          <Muted>never</Muted>
                        )}
                        {account.lastError && (
                          <div title={account.lastError} style={{ fontSize: 12, color: 'var(--neryva-error, #f87171)' }}>
                            last error — hover
                          </div>
                        )}
                      </DataCell>
                      <DataCell $w="24%" $align="right">
                        <RowActions>
                          {DANCE_PROVIDERS.includes(account.provider) && (
                            <IconBtn
                              type="button"
                              aria-label={`OAuth dance for ${account.displayName}`}
                              title={canWrite ? 'Run the OAuth dance (full-page redirect)' : writeDenied}
                              disabled={!canWrite || authorize.isPending}
                              onClick={() => runDance(account.id)}
                            >
                              <KeyRound size={13} strokeWidth={1.7} />
                            </IconBtn>
                          )}
                          <IconBtn
                            type="button"
                            aria-label={account.state === 'active' ? `Pause ${account.displayName}` : `Resume ${account.displayName}`}
                            title={canWrite ? (account.state === 'active' ? 'Pause sync' : 'Resume sync') : writeDenied}
                            disabled={!canWrite || setState.isPending}
                            onClick={() => setState.mutate({ accountId: account.id, state: account.state === 'active' ? 'paused' : 'active' })}
                          >
                            {account.state === 'active' ? <Pause size={13} strokeWidth={1.7} /> : <Play size={13} strokeWidth={1.7} />}
                          </IconBtn>
                          <IconBtn
                            type="button"
                            aria-label={`Sync ${account.displayName} now`}
                            title={canWrite ? 'Run a manual sync' : writeDenied}
                            disabled={!canWrite || sync.isPending}
                            onClick={() => runSync(account.id, account.displayName, account.state)}
                          >
                            <RefreshCw size={13} strokeWidth={1.7} />
                          </IconBtn>
                        </RowActions>
                      </DataCell>
                    </DataRow>
                  ))}
                </DataTable>
              )}
            </QueryView>
            {lastSync && (
              <SyncResultBox>
                <strong>{lastSync.account}</strong> — synced {lastSync.result.synced}, skipped {lastSync.result.skipped}, tombstoned{' '}
                {lastSync.result.tombstoned}
                {lastSync.result.truncated ? ' (bounded fetch truncated — sync again for the remainder)' : ''}. Tombstoned documents
                read <Mono>retired</Mono> in Documents with their mapping kept.
              </SyncResultBox>
            )}
          </Panel>
        </SectionGap>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={11}>
        <SectionGap>
          <Panel
            title="OAuth apps"
            subtitle="Per-tenant provider apps for the dance (owner/admin). Client secrets are write-only."
            action={
              <ActionButton size="sm" variant="secondary" disabled={!canGovern} title={canGovern ? 'Register an OAuth app' : governDenied} onClick={() => setAppOpen(true)}>
                Register app
              </ActionButton>
            }
          >
            {canGovern ? (
              <QueryView
                query={apps}
                isEmpty={(d) => d.length === 0}
                empty={{ title: 'No OAuth apps', description: 'Register the Google app before linking Drive — the dance 409s without it (oauth_app_missing).' }}
              >
                {(rows) => (
                  <DataTable>
                    <DataHead>
                      <DataCell $w="30%">Provider</DataCell>
                      <DataCell $w="40%">Client id</DataCell>
                      <DataCell $w="30%" $align="right">Actions</DataCell>
                    </DataHead>
                    {rows.map((app) => (
                      <DataRow key={app.provider} $interactive={false}>
                        <DataCell $w="30%">
                          <Mono>{app.provider}</Mono>
                        </DataCell>
                        <DataCell $w="40%">{app.clientId ?? <Muted>—</Muted>}</DataCell>
                        <DataCell $w="30%" $align="right">
                          <RowActions>
                            <IconBtn
                              type="button"
                              aria-label={`Delete ${app.provider} OAuth app`}
                              title="Delete this OAuth app"
                              disabled={deleteApp.isPending}
                              onClick={() => deleteApp.mutate(app.provider)}
                            >
                              <Trash2 size={13} strokeWidth={1.7} />
                            </IconBtn>
                          </RowActions>
                        </DataCell>
                      </DataRow>
                    ))}
                  </DataTable>
                )}
              </QueryView>
            ) : (
              <EmptyState icon={<KeyRound size={18} opacity={0.5} />} title="Owner/admin only" description={governDenied} />
            )}
          </Panel>
        </SectionGap>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={20}>
        <SectionGap>
          <Panel
            title="Webhooks"
            subtitle="Deliver signed agent events to your own HTTP endpoints."
            action={
              <Link to="/agent-studio/integrations/webhooks">
                <ActionButton variant="secondary" size="sm">
                  Configure
                  <ArrowRight size={11} strokeWidth={1.8} />
                </ActionButton>
              </Link>
            }
          >
            <PanelCopy>
              POST signed JSON payloads to your endpoint with HMAC-SHA256. Subscribe to the events
              that matter and inspect deliveries in the log.
            </PanelCopy>
          </Panel>
        </SectionGap>
      </motion.div>

      {linkProvider && (
        <LinkModal
          key={linkProvider}
          provider={linkProvider}
          onClose={() => setLinkProvider(null)}
          onLink={(input) => link.mutate(input, { onSuccess: () => setLinkProvider(null) })}
          pending={link.isPending}
        />
      )}
      <OAuthAppModal open={appOpen} onClose={() => setAppOpen(false)} onCreate={(input) => createApp.mutate(input, { onSuccess: () => setAppOpen(false) })} pending={createApp.isPending} />
    </ViewShell>
  );
}

function LinkModal({
  provider,
  onClose,
  onLink,
  pending,
}: {
  provider: ConnectorProvider | null;
  onClose: () => void;
  onLink: (input: { provider: string; displayName: string; config: Record<string, unknown>; credentials?: string }) => void;
  pending: boolean;
}) {
  const spec = PROVIDER_LINK_SPECS.find((s) => s.provider === provider) ?? null;
  const [displayName, setDisplayName] = useState('');
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState('');
  const [pageUrl, setPageUrl] = useState('');

  // Sitemap locator (G9): marketers paste a page URL, not an XML path. We
  // suggest the conventional locations for the user to CONFIRM (open it) —
  // the browser cannot probe them (CORS), and the first sync validates.
  const sitemapCandidates = (() => {
    if (!spec || spec.provider !== 'sitemap') {
      return [];
    }
    try {
      const origin = new URL(pageUrl.trim()).origin;
      return [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/sitemap-index.xml`];
    } catch {
      return [];
    }
  })();

  if (!spec) {
    return null;
  }

  const missingConfig = spec.configFields.filter((f) => f.required && !configValues[f.key]?.trim());
  const needsCredentials = spec.credentials === 'secret-required' || spec.credentials === 'msal-cc';
  const credentialsProblem =
    spec.credentials === 'dance-only' && credentials.trim()
      ? 'Drive binds tokens via the OAuth dance — link without credentials, then authorize.'
      : needsCredentials && credentials.trim().length < 4
        ? 'A credential is required here: this provider has no dance, and linked-without-credential accounts cannot sync or be repaired (no credential-update endpoint exists).'
        : spec.credentials === 'msal-cc' && credentials.trim()
          ? validateMsalCc(credentials)
          : null;

  const valid = displayName.trim() !== '' && missingConfig.length === 0 && !credentialsProblem;

  const submit = () => {
    if (!valid || pending) {
      return;
    }
    const config: Record<string, unknown> = {};
    for (const field of spec.configFields) {
      const value = configValues[field.key]?.trim();
      if (value) {
        config[field.key] = field.key === 'spaces' || field.key === 'locales' ? value.split(',').map((s) => s.trim()).filter(Boolean) : value;
      }
    }
    onLink({
      provider: spec.provider,
      displayName: displayName.trim(),
      config,
      ...(spec.credentials !== 'none' && spec.credentials !== 'dance-only' && credentials.trim() ? { credentials: credentials.trim() } : {}),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Link ${spec.label}`}
      width={560}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton disabled={!valid || pending} onClick={submit}>
            Link account
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.75 }}>{spec.blurb}</p>
      <div style={{ marginTop: 12 }}>
        <TextInput label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={`e.g. ${spec.label} docs`} autoFocus />
      </div>
      {spec.provider === 'sitemap' && (
        <div style={{ marginTop: 12 }}>
          <TextInput
            label="Find your sitemap — paste any page URL"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="https://docs.company.com/handbook"
            hint="Pick the candidate that opens as XML — the first sync validates it."
          />
          {sitemapCandidates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {sitemapCandidates.map((candidate) => (
                <ActionButton
                  key={candidate}
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfigValues((prev) => ({ ...prev, sitemap_url: candidate }))}
                >
                  Use {candidate}
                </ActionButton>
              ))}
            </div>
          )}
        </div>
      )}
      {spec.configFields.map((field) => (
        <div key={field.key} style={{ marginTop: 12 }}>
          <TextInput
            label={`${field.label}${field.required ? ' (required)' : ''}`}
            value={configValues[field.key] ?? ''}
            onChange={(e) => setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            hint={field.hint}
            error={field.required && !configValues[field.key]?.trim() ? 'Required for sync.' : undefined}
          />
        </div>
      ))}
      {spec.credentials !== 'none' && spec.credentials !== 'dance-only' && (
        <div style={{ marginTop: 12 }}>
          <TextArea
            label={spec.credentials === 'msal-cc' ? 'msal-cc JSON bundle' : 'Credential (sealed on arrival — never shown again)'}
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
            rows={spec.credentials === 'msal-cc' ? 4 : 2}
            placeholder={spec.credentials === 'msal-cc' ? '{"client_id": "…", "tenant": "…", "secret": "…"}' : 'Paste the token'}
          />
          {credentialsProblem && <p style={{ fontSize: 12, color: '#f87171' }}>{credentialsProblem}</p>}
        </div>
      )}
      <p style={{ fontSize: 12, opacity: 0.65, marginTop: 12 }}>{spec.credentialsHint}</p>
    </Modal>
  );
}

function validateMsalCc(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.client_id === 'string' && typeof parsed.tenant === 'string' && typeof parsed.secret === 'string' && parsed.secret.length >= 8) {
      return null;
    }
  } catch {
    // fall through to the message
  }
  return 'SharePoint needs an msal-cc JSON bundle {client_id, tenant, secret} with secret ≥ 8 chars.';
}

function OAuthAppModal({
  open,
  onClose,
  onCreate,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { provider: string; clientId: string; clientSecret: string }) => void;
  pending: boolean;
}) {
  const [provider, setProvider] = useState('google_drive');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const valid = provider.trim() !== '' && clientId.trim() !== '' && clientSecret.trim() !== '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register OAuth app"
      width={520}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={!valid || pending}
            onClick={() => {
              onCreate({ provider: provider.trim(), clientId: clientId.trim(), clientSecret: clientSecret.trim() });
              setClientSecret('');
            }}
          >
            Register
          </ActionButton>
        </>
      }
    >
      <TextInput label="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="google_drive" />
      <div style={{ marginTop: 12 }}>
        <TextInput label="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="…" />
      </div>
      <div style={{ marginTop: 12 }}>
        <TextInput
          label="Client secret (write-only — cleared on submit)"
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="…"
          autoComplete="off"
        />
      </div>
    </Modal>
  );
}
