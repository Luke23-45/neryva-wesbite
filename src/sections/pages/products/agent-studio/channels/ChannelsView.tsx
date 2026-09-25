import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Plus, Plug, ShieldCheck, RefreshCw, Trash2, Webhook, Code2 } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
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
  useCreateChannel,
  useUpdateChannel,
  useDeactivateChannel,
  useRotateChannelCredentials,
  useVerifyChannel,
  useWebhookSetup,
  widgetSnippet,
  widgetSnippetOrigin,
  PLATFORM_CREDENTIAL_SPECS,
  type ChannelAccount,
  type ConnectablePlatform,
  type WebhookSetupResult,
} from '@hooks/studio/useSetupChannels';
import { useAssistants } from '@hooks/studio/useAssistants';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';

/**
 * Serve plane (customer-setup-review.md G1) — where published agents meet
 * customers. Accounts bind ONE assistant at create (routability-checked:
 * same-org + template channel bindings honored); web is keyless with an
 * origin allowlist; deactivate DESTROYS credentials (reconnect re-seals);
 * webhook verify tokens show ONCE. Only whatsapp/messenger/telegram/web can
 * be credentialed today (instagram/x/email are listed but unsupported).
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

const ReturnBanner = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.info.border};
  background: ${({ theme }) => theme.app.status.info.bg};
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 12px;
  font-size: 13px;
`;

const TokenBox = styled.div`
  border: 1px dashed ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 12px;
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
  const webhookSetup = useWebhookSetup();
  const deactivate = useDeactivateChannel();

  const [connectOpen, setConnectOpen] = useState(false);
  const [editing, setEditing] = useState<ChannelAccount | null>(null);
  const [deactivating, setDeactivating] = useState<ChannelAccount | null>(null);
  const [rotating, setRotating] = useState<ChannelAccount | null>(null);
  const [setupResult, setSetupResult] = useState<{ account: ChannelAccount; result: WebhookSetupResult } | null>(null);

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
        <ActionButton size="sm" disabled={!canGovern} title={canGovern ? 'Connect a platform' : governDenied} onClick={() => setConnectOpen(true)}>
          <Plus size={14} strokeWidth={2} />
          Connect
        </ActionButton>
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
                        <Mono>{account.platform}</Mono>
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
                          <IconBtn
                            type="button"
                            aria-label={`Webhook setup for ${account.displayName}`}
                            title={canGovern ? 'Get the callback URL (+ once-shown verify token)' : governDenied}
                            disabled={!canGovern || webhookSetup.isPending}
                            onClick={() =>
                              webhookSetup.mutate(account.id, {
                                onSuccess: (result) => setSetupResult({ account, result }),
                              })
                            }
                          >
                            <Webhook size={13} strokeWidth={1.7} />
                          </IconBtn>
                          {account.platform === 'web' && account.publicKey ? (
                            <CopyButton value={widgetSnippet(account.publicKey)} label="Copy widget snippet" />
                          ) : null}
                          <IconBtn
                            type="button"
                            aria-label={`Rotate credentials for ${account.displayName}`}
                            title={canGovern ? 'Rotate sealed credentials' : governDenied}
                            disabled={!canGovern || account.platform === 'web'}
                            onClick={() => setRotating(account)}
                          >
                            <RefreshCw size={13} strokeWidth={1.7} />
                          </IconBtn>
                          <IconBtn
                            type="button"
                            aria-label={`Edit ${account.displayName}`}
                            title={canGovern ? 'Edit binding and config' : governDenied}
                            disabled={!canGovern}
                            onClick={() => setEditing(account)}
                          >
                            <Code2 size={13} strokeWidth={1.7} />
                          </IconBtn>
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

      <ConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        initialAssistantId={incomingAssistantId}
        returnTo={returnTo}
        onConnectedReturn={() => {
          if (returnTo) {
            navigate({ to: returnTo });
          }
        }}
      />
      {editing && (
        <EditModal
          key={editing.id}
          account={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {rotating && (
        <RotateModal
          key={rotating.id}
          account={rotating}
          onClose={() => setRotating(null)}
        />
      )}
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
      {setupResult && (
        <Modal open onClose={() => setSetupResult(null)} title={`Webhook — ${setupResult.account.displayName}`} width={600} footer={<ActionButton variant="secondary" onClick={() => setSetupResult(null)}>Done</ActionButton>}>
          {setupResult.result.webhookUrl ? (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13, margin: '0 0 6px' }}>Callback URL (paste into the platform dashboard):</p>
              <Mono>{setupResult.result.webhookUrl}</Mono>{' '}
              <CopyButton value={setupResult.result.webhookUrl} label="Copy callback URL" />
              {/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])([:/]|$)/i.test(setupResult.result.webhookUrl) ? (
                <p style={{ fontSize: 12, color: '#b45309', margin: '6px 0 0' }}>
                  This URL points at localhost — the platform cannot reach it. Set ENGINE_BASE_URL to this
                  deployment's public engine URL and re-run webhook setup.
                </p>
              ) : null}
            </div>
          ) : (
            <p style={{ fontSize: 13 }}><Muted>No callback URL returned.</Muted></p>
          )}
          {setupResult.result.verifyToken ? (
            <TokenBox>
              <strong>Verify token — shown ONCE, never again.</strong>
              <div style={{ marginTop: 6 }}><Mono>{setupResult.result.verifyToken}</Mono>{' '}<CopyButton value={setupResult.result.verifyToken} label="Copy verify token" /></div>
            </TokenBox>
          ) : (
            <p style={{ fontSize: 13 }}><Muted>{setupResult.account.platform === 'telegram' ? 'Telegram registers server-side — no token step.' : 'No verify token for this platform.'}</Muted></p>
          )}
          {setupResult.account.platform === 'web' && setupResult.account.publicKey ? (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 13, margin: '0 0 6px' }}>
                Loader snippet (paste before <Mono>{'</body>'}</Mono>; baked for <Mono>{widgetSnippetOrigin()}</Mono> —
                re-copy from your production console for live sites):
              </p>
              <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{widgetSnippet(setupResult.account.publicKey)}</pre>{' '}
              <CopyButton value={widgetSnippet(setupResult.account.publicKey)} label="Copy snippet" />
            </div>
          ) : null}
        </Modal>
      )}
    </ViewShell>
  );
}

function ConnectModal({
  open,
  onClose,
  initialAssistantId,
  returnTo,
  onConnectedReturn,
}: {
  open: boolean;
  onClose: () => void;
  /** C14 publish exit — preselects the serving assistant (still changeable). */
  initialAssistantId?: string | null;
  /** C14 publish exit — post-connect destination (the agent detail URL). */
  returnTo?: string | null;
  onConnectedReturn?: () => void;
}) {
  const create = useCreateChannel();
  const assistants = useAssistants();
  const [platform, setPlatform] = useState<ConnectablePlatform>('web');
  const [displayName, setDisplayName] = useState('');
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
  const [assistantId, setAssistantId] = useState(initialAssistantId ?? '');
  const [origins, setOrigins] = useState('');
  const [greeting, setGreeting] = useState('');

  const spec = PLATFORM_CREDENTIAL_SPECS.find((s) => s.platform === platform) ?? PLATFORM_CREDENTIAL_SPECS[3];

  const originsList = origins.split(',').map((s) => s.trim().replace(/\/$/, '').toLowerCase()).filter(Boolean);
  const originsProblem = platform === 'web' && originsList.length === 0 ? 'Web channels require at least one origin (scheme://host).' : null;
  const nameProblem = !displayName.trim() ? 'Display name is required.' : null;
  const assistantProblem = !assistantId ? 'Binding is required — channel conversations pin this assistant (routability-checked).' : null;
  const credentialProblems = spec.fields
    .filter((field) => !(credentialValues[field.key]?.trim()))
    .map((field) => `${field.label} is required.`);

  const problems = [nameProblem, assistantProblem, originsProblem, ...credentialProblems].filter((p): p is string => p !== null);

  const submit = () => {
    if (problems.length > 0 || create.isPending) {
      return;
    }
    const credentials: Record<string, unknown> = {};
    for (const field of spec.fields) {
      credentials[field.key] = credentialValues[field.key].trim();
    }
    const config: Record<string, unknown> = { default_assistant_id: assistantId };
    if (platform === 'web') {
      config.allowed_domains = originsList;
      if (greeting.trim()) {
        config.greeting = greeting.trim().slice(0, 500);
      }
    }
    create.mutate(
      { platform, displayName: displayName.trim(), credentials, config },
      {
        onSuccess: () => {
          toast.success('Channel connected as pending — verify it, then set up the webhook.');
          onClose();
          onConnectedReturn?.();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Connect a channel"
      width={600}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton disabled={problems.length > 0 || create.isPending} onClick={submit}>
            <Plug size={13} strokeWidth={1.8} />
            Connect (starts pending)
          </ActionButton>
        </>
      }
    >
      <label style={{ fontSize: 13, display: 'block' }}>
        Platform (only credentialable platforms are offered)
        <select value={platform} onChange={(e) => { setPlatform(e.target.value as ConnectablePlatform); setCredentialValues({}); }} style={{ display: 'block', width: '100%', marginTop: 4 }}>
          {PLATFORM_CREDENTIAL_SPECS.map((s) => (
            <option key={s.platform} value={s.platform}>{s.label}</option>
          ))}
        </select>
      </label>
      <p style={{ fontSize: 12, opacity: 0.7 }}>{spec.blurb}</p>
      <div style={{ marginTop: 12 }}>
        <TextInput label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Support WhatsApp" autoFocus error={nameProblem ?? undefined} />
      </div>
      {spec.fields.map((field) => (
        <div key={field.key} style={{ marginTop: 12 }}>
          <TextInput
            label={field.label}
            type={field.secret === true ? 'password' : 'text'}
            value={credentialValues[field.key] ?? ''}
            onChange={(e) => setCredentialValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            hint={field.hint}
            autoComplete="off"
          />
        </div>
      ))}
      {spec.fields.length === 0 && (
        <p style={{ fontSize: 12, opacity: 0.7 }}>Keyless — the engine generates the public key on connect.</p>
      )}
      <label style={{ fontSize: 13, display: 'block', marginTop: 12 }}>
        Serving assistant (required)
        <select value={assistantId} onChange={(e) => setAssistantId(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
          <option value="">Pick the assistant this channel serves…</option>
          {(assistants.data ?? []).map((assistant) => (
            <option key={assistant.id} value={assistant.id}>{assistant.name} ({assistant.status})</option>
          ))}
        </select>
      </label>
      {assistantProblem && <p style={{ fontSize: 12, color: '#f87171' }}>{assistantProblem}</p>}
      {returnTo && !assistantProblem && (
        <p style={{ fontSize: 12, opacity: 0.7 }}>After connecting you return to the agent.</p>
      )}
      {platform === 'web' && (
        <>
          <div style={{ marginTop: 12 }}>
            <TextInput
              label="Allowed origins (comma-separated, required)"
              value={origins}
              onChange={(e) => setOrigins(e.target.value)}
              placeholder="https://acme.com, https://shop.acme.com"
              hint="Exact scheme://host entries — CORS reflects ONLY these, never a wildcard."
              error={originsProblem ?? undefined}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <TextInput label="Greeting (optional, ≤500)" value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder="Hi! How can we help?" />
          </div>
        </>
      )}
      {problems.length > 0 && (
        <ul style={{ fontSize: 12, color: '#f87171', paddingLeft: 18 }}>
          {problems.map((problem, i) => (
            <li key={i}>{problem}</li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function EditModal({ account, onClose }: { account: ChannelAccount; onClose: () => void }) {
  const update = useUpdateChannel();
  const assistants = useAssistants();
  const currentBinding = typeof account.config.default_assistant_id === 'string' ? account.config.default_assistant_id : '';
  const [displayName, setDisplayName] = useState(account.displayName);
  // Preserve the account's actual status — never coerce pending→active as a
  // side effect of editing an unrelated field (P5I-CH-C3).
  const [status, setStatus] = useState(account.status ?? 'active');
  const [assistantId, setAssistantId] = useState(currentBinding);
  const [origins, setOrigins] = useState(Array.isArray(account.config.allowed_domains) ? (account.config.allowed_domains as string[]).join(', ') : '');
  const [greeting, setGreeting] = useState(typeof account.config.greeting === 'string' ? account.config.greeting : '');

  const originsList = origins.split(',').map((s) => s.trim().replace(/\/$/, '').toLowerCase()).filter(Boolean);

  const submit = () => {
    const config: Record<string, unknown> = {};
    if (assistantId !== currentBinding) {
      config.default_assistant_id = assistantId;
    }
    if (account.platform === 'web') {
      config.allowed_domains = originsList;
      config.greeting = greeting.trim().slice(0, 500);
    }
    update.mutate(
      {
        channelId: account.id,
        ...(displayName.trim() !== account.displayName ? { displayName: displayName.trim() } : {}),
        ...(status !== (account.status ?? 'active') ? { status: status as 'active' | 'suspended' } : {}),
        ...(Object.keys(config).length > 0 ? { config } : {}),
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit — ${account.displayName}`}
      width={600}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton disabled={update.isPending} onClick={submit}>
            Save
          </ActionButton>
        </>
      }
    >
      <TextInput label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <label style={{ fontSize: 13, flex: 1 }}>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
            {status === 'pending' ? <option value="pending" disabled>pending (verify to activate)</option> : null}
          </select>
        </label>
        <label style={{ fontSize: 13, flex: 2 }}>
          Serving assistant (re-binding re-checks routability)
          <select value={assistantId} onChange={(e) => setAssistantId(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
            <option value="">Unbound (legacy — new accounts always bind)</option>
            {(assistants.data ?? []).map((assistant) => (
              <option key={assistant.id} value={assistant.id}>{assistant.name} ({assistant.status})</option>
            ))}
          </select>
        </label>
      </div>
      {account.platform === 'web' && (
        <>
          <div style={{ marginTop: 12 }}>
            <TextInput label="Allowed origins (comma-separated)" value={origins} onChange={(e) => setOrigins(e.target.value)} hint="Merge-patched: the full list you enter becomes the allowlist." />
          </div>
          <div style={{ marginTop: 12 }}>
            <TextInput label="Greeting (≤500)" value={greeting} onChange={(e) => setGreeting(e.target.value)} />
          </div>
        </>
      )}
      {account.platform !== 'web' && (
        <p style={{ fontSize: 12, opacity: 0.7 }}>
          Platform extras (templates, notes, voice) edit through the same merge-patch config — ask for the fields you need; only
          known keys are shown here to avoid silent drops.
        </p>
      )}
      {account.publicKey && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          Public key: <Mono>{account.publicKey}</Mono> <CopyButton value={account.publicKey} label="Copy public key" />
        </div>
      )}
      {account.webhookUrl && (
        <div style={{ marginTop: 8, fontSize: 13 }}>
          Webhook: <Mono>{account.webhookUrl}</Mono> <CopyButton value={account.webhookUrl} label="Copy webhook URL" />
        </div>
      )}
    </Modal>
  );
}

function RotateModal({ account, onClose }: { account: ChannelAccount; onClose: () => void }) {
  const rotate = useRotateChannelCredentials();
  const spec = PLATFORM_CREDENTIAL_SPECS.find((s) => s.platform === account.platform);
  const [values, setValues] = useState<Record<string, string>>({});

  if (!spec || spec.fields.length === 0) {
    return null;
  }

  const missing = spec.fields.filter((field) => !(values[field.key]?.trim()));

  return (
    <Modal
      open
      onClose={onClose}
      title={`Rotate credentials — ${account.displayName}`}
      width={520}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={missing.length > 0 || rotate.isPending}
            onClick={() => {
              const credentials: Record<string, unknown> = {};
              for (const field of spec.fields) {
                credentials[field.key] = (values[field.key] ?? '').trim();
              }
              rotate.mutate({ channelId: account.id, credentials }, { onSuccess: () => onClose() });
            }}
          >
            Rotate (re-seals immediately)
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.75 }}>New material seals on arrival and is never shown again. Old material stops working at once.</p>
      {spec.fields.map((field) => (
        <div key={field.key} style={{ marginTop: 12 }}>
          <TextInput
            label={field.label}
            type="password"
            value={values[field.key] ?? ''}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            hint={field.hint}
            autoComplete="off"
          />
        </div>
      ))}
      {missing.length > 0 && <p style={{ fontSize: 12, color: '#f87171' }}>All credential fields are required for rotation.</p>}
    </Modal>
  );
}
