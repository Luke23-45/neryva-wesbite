import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled, { css } from 'styled-components';
import { Plus, ShieldCheck, Trash2, Webhook, Code2, KeyRound } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { CopyButton } from '@components/common/ui/CopyButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import {
  useChannels,
  isChannelsModuleDisabled,
  useDeactivateChannel,
  useVerifyChannel,
  widgetSnippet,
  type ChannelAccount,
} from '@hooks/studio/useSetupChannels';
import { useAssistants } from '@hooks/studio/useAssistants';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { PlatformIcon } from './platformIcons';

/**
 * Serve plane (customer-setup-review.md G1) — where published agents meet
 * customers. Accounts bind ONE assistant at create (routability-checked:
 * same-org + template channel bindings honored); web is keyless with an
 * origin allowlist; deactivate DESTROYS credentials (reconnect re-seals);
 * webhook verify tokens show ONCE. Only whatsapp/messenger/telegram/web can
 * be credentialed today (instagram/x/email are listed but unsupported).
 *
 * Connect/edit/rotate/webhook-setup are dedicated routed sections
 * (C-1/C-2/C-3) — the list below only keeps inline row actions (verify,
 * copy snippet) and the destructive deactivate ConfirmDialog.
 */

const statusTone: Record<string, StatusTone> = {
  active: 'success',
  pending: 'info',
  suspended: 'warning',
};

/** Human-readable health tooltip — never leak raw JSON into title/aria. */
function healthTitle(health: Record<string, unknown>): string {
  const ok = health.ok === true ? 'ok' : health.ok === false ? 'failing' : 'unknown';
  const message = typeof health.message === 'string' && health.message ? `: ${health.message}` : '';
  const at = typeof health.last_verified === 'string' && health.last_verified ? ` (last verified ${health.last_verified})` : '';
  return `Health ${ok}${message}${at}`;
}

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.55;
`;

const SectionGap = styled.div`
  margin-top: 18px;
`;

const RowActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
`;

const iconBtnBase = css`
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

const IconBtn = styled.button`
  ${iconBtnBase}
`;

const ReturnBanner = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.info.border};
  background: ${({ theme }) => theme.app.status.info.bg};
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 12px;
  font-size: 13px;
`;

const PlatformCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
`;

export function ChannelsView() {
  const { role } = useOrg();
  const navigate = useNavigate();
  // C14 publish exit: ?returnTo=<agent detail URL> + ?assistantId=<id>
  // preselect the assistant and return after connect — never a dead end.
  // Both optional; the library works standalone without them.
  const search = useSearch({ from: '/agent-studio/channels' });
  const returnTo = typeof search.returnTo === 'string' && search.returnTo.startsWith('/agent-studio/') ? search.returnTo : null;
  const incomingAssistantId = typeof search.assistantId === 'string' && search.assistantId !== '' ? search.assistantId : null;
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');
  const canVerify = canSetup(role, 'setup:author');
  const verifyDenied = setupDeniedCopy(role, 'setup:author');
  const channels = useChannels();
  // P5-C4: a 404 on the channels read means the channels module is disabled
  // in this deployment (engine default) — not a failure. Show an honest
  // "not enabled" panel instead of the generic error + pointless retry
  // (J1-03 pattern, same as the dashboard setup checklist).
  const channelsDisabled = channels.isError && isChannelsModuleDisabled(channels.error);
  const assistants = useAssistants();
  const verify = useVerifyChannel();
  const deactivate = useDeactivateChannel();

  const [deactivating, setDeactivating] = useState<ChannelAccount | null>(null);

  const assistantNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const assistant of assistants.data ?? []) {
      map.set(assistant.id, assistant.name);
    }
    return map;
  }, [assistants.data]);

  const bindingOf = (account: ChannelAccount): string | null => {
    const id = account.config.default_assistant_id;
    return typeof id === 'string' && id !== '' ? id : null;
  };

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Channels</ViewTitle>
          <ViewSubtitle>
            Where published agents meet customers — connect a platform, bind its assistant, verify, then set up the webhook.
          </ViewSubtitle>
        </ViewHeader>
        {canGovern ? (
          <ActionButton
            size="sm"
            onClick={() =>
              navigate({
                to: '/agent-studio/channels/connect',
                search: { returnTo: returnTo ?? undefined, assistantId: incomingAssistantId ?? undefined },
              })
            }
          >
            <Plus size={14} strokeWidth={2} />
            Connect
          </ActionButton>
        ) : (
          <ActionButton size="sm" disabled title={governDenied}>
            <Plus size={14} strokeWidth={2} />
            Connect
          </ActionButton>
        )}
      </ViewHeaderRow>

      {returnTo && (
        <ReturnBanner role="status">
          Connected from publish — the serving assistant is preselected below. After connecting you return to the agent.{' '}
          <Link to={returnTo}>Back now →</Link>
        </ReturnBanner>
      )}

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          title="Channel accounts"
          subtitle="Credentials seal on arrival and never render. Deactivating destroys credentials — it is not a pause."
          flush
        >
          {channelsDisabled ? (
            <p style={{ padding: '20px 24px', fontSize: 13, lineHeight: 1.5 }}>
              <Muted>
                Channels are not enabled in this deployment — the channel plane (WhatsApp, Messenger, Telegram,
                website widget) is switched off, so no accounts can be listed or connected here. Ask your platform
                operator to enable it.
              </Muted>
            </p>
          ) : (
          <QueryView
            query={channels}
            isEmpty={(d) => d.length === 0}
            empty={{ title: 'No channels connected', description: 'Connect WhatsApp, Messenger, Telegram, or the website widget — then bind the assistant that serves it.' }}
          >
            {(rows) => (
              <DataTable>
                <DataHead>
                  <DataCell $w="20%">Account</DataCell>
                  <DataCell $w="12%">Platform</DataCell>
                  <DataCell $w="10%">Status</DataCell>
                  <DataCell $w="22%">Serving assistant</DataCell>
                  <DataCell $w="12%">Health</DataCell>
                  <DataCell $w="24%" $align="right">Actions</DataCell>
                </DataHead>
                {rows.map((account, i) => {
                  const binding = bindingOf(account);
                  return (
                    <DataRow key={account.id} as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={i + 2} $interactive={false}>
                      <DataCell $w="20%">{account.displayName}</DataCell>
                      <DataCell $w="12%">
                        <PlatformCell>
                          <PlatformIcon platform={account.platform} size={16} />
                          <Mono>{account.platform}</Mono>
                        </PlatformCell>
                      </DataCell>
                      <DataCell $w="10%">
                        <StatusPill tone={statusTone[account.status ?? ''] ?? 'neutral'} dot={false}>
                          {account.status ?? 'unknown'}
                        </StatusPill>
                      </DataCell>
                      <DataCell $w="22%">
                        {binding ? (assistantNames.get(binding) ?? <Mono>{binding.slice(0, 8)}</Mono>) : <Muted>unbound (legacy)</Muted>}
                      </DataCell>
                      <DataCell $w="12%">
                        {account.health && Object.keys(account.health).length > 0 ? (
                          <span title={healthTitle(account.health)}>checked ✓</span>
                        ) : (
                          <Muted>—</Muted>
                        )}
                      </DataCell>
                      <DataCell $w="24%" $align="right">
                        <RowActions>
                          <IconBtn
                            type="button"
                            aria-label={`Verify ${account.displayName}`}
                            title={canVerify ? 'Verify credentials live (pending→active on success)' : verifyDenied}
                            disabled={!canVerify || verify.isPending}
                            onClick={() => verify.mutate(account.id)}
                          >
                            <ShieldCheck size={13} strokeWidth={1.7} />
                          </IconBtn>
                          {canGovern ? (
                            <IconBtn
                              type="button"
                              aria-label={`Webhook setup for ${account.displayName}`}
                              title="Get the callback URL (+ once-shown verify token)"
                              onClick={() =>
                                navigate({
                                  to: '/agent-studio/channels/$accountId/webhook-setup',
                                  params: { accountId: account.id },
                                  search: { returnTo: undefined, assistantId: undefined },
                                })
                              }
                            >
                              <Webhook size={13} strokeWidth={1.7} />
                            </IconBtn>
                          ) : (
                            <IconBtn
                              type="button"
                              aria-label={`Webhook setup for ${account.displayName}`}
                              title={governDenied}
                              disabled
                            >
                              <Webhook size={13} strokeWidth={1.7} />
                            </IconBtn>
                          )}
                          {account.platform === 'web' && account.publicKey ? (
                            <CopyButton value={widgetSnippet(account.publicKey)} label="Copy widget snippet" />
                          ) : null}
                          {canGovern ? (
                            <IconBtn
                              type="button"
                              aria-label={`Rotate credentials for ${account.displayName}`}
                              title="Rotate sealed credentials (credentials section)"
                              onClick={() =>
                                navigate({
                                  to: '/agent-studio/channels/$accountId',
                                  params: { accountId: account.id },
                                  search: { returnTo: undefined, assistantId: undefined },
                                })
                              }
                            >
                              <KeyRound size={13} strokeWidth={1.7} />
                            </IconBtn>
                          ) : (
                            <IconBtn
                              type="button"
                              aria-label={`Rotate credentials for ${account.displayName}`}
                              title={governDenied}
                              disabled
                            >
                              <KeyRound size={13} strokeWidth={1.7} />
                            </IconBtn>
                          )}
                          {canGovern ? (
                            <IconBtn
                              type="button"
                              aria-label={`Edit ${account.displayName}`}
                              title="Edit binding and config"
                              onClick={() =>
                                navigate({
                                  to: '/agent-studio/channels/$accountId',
                                  params: { accountId: account.id },
                                  search: { returnTo: undefined, assistantId: undefined },
                                })
                              }
                            >
                              <Code2 size={13} strokeWidth={1.7} />
                            </IconBtn>
                          ) : (
                            <IconBtn
                              type="button"
                              aria-label={`Edit ${account.displayName}`}
                              title={governDenied}
                              disabled
                            >
                              <Code2 size={13} strokeWidth={1.7} />
                            </IconBtn>
                          )}
                          <IconBtn
                            type="button"
                            aria-label={`Deactivate ${account.displayName}`}
                            title={canGovern ? 'Deactivate (DESTROYS credentials)' : governDenied}
                            disabled={!canGovern || deactivate.isPending}
                            onClick={() => setDeactivating(account)}
                          >
                            <Trash2 size={13} strokeWidth={1.7} />
                          </IconBtn>
                        </RowActions>
                      </DataCell>
                    </DataRow>
                  );
                })}
              </DataTable>
            )}
          </QueryView>
          )}
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={10}>
        <SectionGap>
          <Panel
            title="How serving works"
            subtitle="The path every message takes."
          >
            <ol style={{ fontSize: 13, lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
              <li>Connect the platform (credentials seal immediately; web generates a public key instead).</li>
              <li>Bind the serving assistant (required — routability-checked against org + template channel bindings).</li>
              <li>Verify credentials live — success flips pending→active.</li>
              <li>Webhook-setup for Meta platforms (paste the callback URL + verify token, shown once) or Telegram (registered server-side); embed the loader snippet for web.</li>
              <li>Channel conversations pin the bound assistant — in-flight runs survive pointer moves.</li>
            </ol>
          </Panel>
        </SectionGap>
      </motion.div>

      <ConfirmDialog
        open={deactivating !== null}
        title="Deactivate this channel?"
        message={deactivating ? `“${deactivating.displayName}” stops serving AND its sealed credentials are destroyed — reconnecting means re-sealing. History stays in audit.` : ''}
        destructive
        confirmLabel="Deactivate"
        onConfirm={() => {
          if (deactivating) {
            deactivate.mutate(deactivating.id);
          }
          setDeactivating(null);
        }}
        onCancel={() => setDeactivating(null)}
      />
    </ViewShell>
  );
}
