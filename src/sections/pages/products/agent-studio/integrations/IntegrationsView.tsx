import { useMemo, useState } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { ArrowRight, Pause, Play, RefreshCw, KeyRound, Trash2 } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
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
  useSetConnectorState,
  useSyncConnector,
  useOAuthApps,
  useDeleteOAuthApp,
  useOAuthAuthorize,
  PROVIDER_LINK_SPECS,
  type SyncResult,
} from '@hooks/studio/useSetupConnectors';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { ProviderIcon } from './ProviderIcon';

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
// Drive accounts only; the server 400s any other provider.
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

/** Linked-accounts row with the just-linked account highlighted. */
const HighlightRow = styled(DataRow)<{ $highlight: boolean }>`
  ${({ $highlight, theme }) => $highlight && `background: ${theme.app.surface.active};`}
`;

export function IntegrationsView() {
  const { role } = useOrg();
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');

  const connectors = useConnectors();
  const setState = useSetConnectorState();
  const sync = useSyncConnector();
  const authorize = useOAuthAuthorize();
  const apps = useOAuthApps({ enabled: canGovern });
  const deleteApp = useDeleteOAuthApp();

  const [lastSync, setLastSync] = useState<{ account: string; result: SyncResult } | null>(null);

  // Just-linked highlight: the link section navigates back with ?linked=<id>.
  const search = useSearch({ strict: false }) as { linked?: string };
  const linkedId = typeof search.linked === 'string' ? search.linked : null;

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
                  <Icon $color="inherit">
                    <ProviderIcon provider={spec.provider} />
                  </Icon>
                  <div style={{ minWidth: 0 }}>
                    <CardName>{spec.label}</CardName>
                    <CardCategory>{byProvider.get(spec.provider) ?? 0} linked</CardCategory>
                  </div>
                </CardHead>
                <CardDescription>{spec.blurb}</CardDescription>
                <CardFoot>
                  <StatusText>{spec.credentials === 'dance-only' ? 'OAuth dance' : spec.credentials === 'none' ? 'Keyless' : 'Sealed secret'}</StatusText>
                  {canWrite ? (
                    <Link to="/agent-studio/integrations/link/$provider" params={{ provider: spec.provider }} title={`Link a ${spec.label} account`}>
                      <ActionButton size="sm" variant="secondary">
                        Link
                      </ActionButton>
                    </Link>
                  ) : (
                    <ActionButton size="sm" variant="secondary" disabled title={writeDenied}>
                      Link
                    </ActionButton>
                  )}
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
              empty={{ title: 'No connectors linked', description: 'Link a provider above — synced content lands in Documents with external slugs.' }}
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
                    <HighlightRow key={account.id} $interactive={false} $highlight={linkedId === account.id}>
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
                    </HighlightRow>
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
              canGovern ? (
                <Link to="/agent-studio/integrations/oauth-apps/new" title="Register an OAuth app">
                  <ActionButton size="sm" variant="secondary">
                    Register app
                  </ActionButton>
                </Link>
              ) : (
                <ActionButton size="sm" variant="secondary" disabled title={governDenied}>
                  Register app
                </ActionButton>
              )
            }
          >
            {canGovern ? (
              <QueryView
                query={apps}
                isEmpty={(d) => d.length === 0}
                empty={{ title: 'No OAuth apps', description: 'Register the Google app before linking Drive — linking fails without it (missing OAuth app registration).' }}
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
    </ViewShell>
  );
}
