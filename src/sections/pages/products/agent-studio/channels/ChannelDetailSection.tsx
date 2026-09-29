import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { CopyButton } from '@components/common/ui/CopyButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { pageItem } from '@styles/motion';
import {
  useChannel,
  useUpdateChannel,
  useDeactivateChannel,
  useRotateChannelCredentials,
  validateCredentialField,
  normalizeOriginEntry,
  quickRepliesFieldValue,
  buildChannelExtrasPatch,
  outOfWindowTemplateProblem,
  PLATFORM_CREDENTIAL_SPECS,
  type ChannelAccount,
} from '@hooks/studio/useSetupChannels';
import { useAssistants } from '@hooks/studio/useAssistants';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { PlatformIcon } from './platformIcons';

const statusTone: Record<string, StatusTone> = {
  active: 'success',
  pending: 'info',
  suspended: 'warning',
};

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.55;
`;

const HeaderMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
`;

const FieldLabel = styled.label`
  font-size: 13px;
  display: block;
`;

const FieldSelect = styled.select`
  display: block;
  width: 100%;
  margin-top: 4px;
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 9px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const FactRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }
`;

const FactLabel = styled.span`
  color: ${({ theme }) => theme.app.text.secondary};
`;

const InlineError = styled.p`
  font-size: 12px;
  color: #f87171;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  margin-top: 16px;
`;

const CheckboxLabel = styled.label`
  font-size: 13px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 12px;
`;

const CheckboxHint = styled.span`
  display: block;
  font-size: 12px;
  opacity: 0.7;
  font-weight: 400;
`;

const DangerText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

/** Human-readable health tooltip — never leak raw JSON into title/aria. */
function healthTitle(health: Record<string, unknown>): string {
  const ok = health.ok === true ? 'ok' : health.ok === false ? 'failing' : 'unknown';
  const message = typeof health.message === 'string' && health.message ? `: ${health.message}` : '';
  const at = typeof health.last_verified === 'string' && health.last_verified ? ` (last verified ${health.last_verified})` : '';
  return `Health ${ok}${message}${at}`;
}

/**
 * Channel account detail — dedicated section replacing EditModal (C-2).
 * Apple Settings-style hierarchy: Overview → Configuration → Messaging
 * extras → Credentials → Danger zone. Validation and PATCH semantics
 * byte-identical to the modal version (P5I-CH-C3, H13, H12, G2, G3).
 */
export function ChannelDetailSection() {
  const params = useParams({ from: '/agent-studio/channels/$accountId' });
  const navigate = useNavigate();
  const { role } = useOrg();
  const canGovern = canSetup(role, 'setup:govern');
  const channel = useChannel(params.accountId);

  // Non-govern users bounce to the list (server gates the mutations too) —
  // account names, URLs, and config are a govern surface; nothing renders
  // before the gate.
  useEffect(() => {
    if (!canGovern) {
      navigate({ to: '/agent-studio/channels', search: { returnTo: undefined, assistantId: undefined } });
    }
  }, [canGovern, navigate]);

  // Unknown account id → back to the list (same rule as integrations'
  // unknown provider).
  useEffect(() => {
    if (!channel.isPending && !channel.isError && !channel.data) {
      navigate({ to: '/agent-studio/channels', search: { returnTo: undefined, assistantId: undefined } });
    }
  }, [channel.isPending, channel.isError, channel.data, navigate]);

  if (!canGovern) {
    return null;
  }

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/channels">
        <span aria-hidden="true">‹</span> Channels
      </SectionBackRow>
      <QueryView
        query={channel}
        isEmpty={(d) => d === null}
        empty={{ title: 'Channel not found', description: 'This channel account does not exist in your organization.' }}
      >
        {(account) => (account ? <ChannelDetailForm key={account.id} account={account} /> : null)}
      </QueryView>
    </ViewShell>
  );
}

function ChannelDetailForm({ account }: { account: ChannelAccount }) {
  const { role } = useOrg();
  const navigate = useNavigate();
  // C14: search is validated on the parent layout route and inherited here —
  // thread it onward so detail → webhook-setup keeps the publish exit alive.
  const detailSearch = useSearch({ from: '/agent-studio/channels/$accountId' });
  const returnTo = typeof detailSearch.returnTo === 'string' && detailSearch.returnTo.startsWith('/agent-studio/') ? detailSearch.returnTo : null;
  const incomingAssistantId = typeof detailSearch.assistantId === 'string' && detailSearch.assistantId !== '' ? detailSearch.assistantId : null;
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');
  const update = useUpdateChannel();
  const assistants = useAssistants();
  const deactivate = useDeactivateChannel();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const currentBinding = typeof account.config.default_assistant_id === 'string' ? account.config.default_assistant_id : '';
  const [displayName, setDisplayName] = useState(account.displayName);
  // Preserve the account's actual status — never coerce pending→active as a
  // side effect of editing an unrelated field (P5I-CH-C3).
  const [status, setStatus] = useState(account.status ?? 'active');
  const [assistantId, setAssistantId] = useState(currentBinding);
  const [origins, setOrigins] = useState(Array.isArray(account.config.allowed_domains) ? (account.config.allowed_domains as string[]).join(', ') : '');
  const [greeting, setGreeting] = useState(typeof account.config.greeting === 'string' ? account.config.greeting : '');
  // H13: the engine consumes these config keys (escalation notes in the
  // outbound pipeline; voice + out-of-window template/note on Meta
  // platforms).
  const [escalationNote, setEscalationNote] = useState(typeof account.config.escalation_note === 'string' ? account.config.escalation_note : '');
  const [escalationResolvedNote, setEscalationResolvedNote] = useState(
    typeof account.config.escalation_resolved_note === 'string' ? account.config.escalation_resolved_note : '',
  );
  const [voiceReplies, setVoiceReplies] = useState(account.config.voice_replies_enabled === true);
  const oowTemplate = typeof account.config.out_of_window_template === 'object' && account.config.out_of_window_template !== null
    ? (account.config.out_of_window_template as { name?: unknown; language?: unknown })
    : null;
  const [oowTemplateName, setOowTemplateName] = useState(typeof oowTemplate?.name === 'string' ? oowTemplate.name : '');
  const [oowTemplateLanguage, setOowTemplateLanguage] = useState(typeof oowTemplate?.language === 'string' ? oowTemplate.language : '');
  const [oowNote, setOowNote] = useState(typeof account.config.out_of_window_note === 'string' ? account.config.out_of_window_note : '');
  // H12: the engine consumes quick_replies (string[], ≤6 × ≤64) and
  // csat_enabled (boolean) on web channel configs.
  // G2: the field initializer lives in quickRepliesFieldValue so the
  // load→save separator is unit-tested (real newline, never '\n' literal).
  const [quickReplies, setQuickReplies] = useState(() => quickRepliesFieldValue(account.config));
  const [csatEnabled, setCsatEnabled] = useState(account.config.csat_enabled === true);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // H5: same origin normalization as the connect section.
  const originsList = origins.split(',').map(normalizeOriginEntry).filter(Boolean);

  // G3: a half-filled out-of-window template is never persisted — block save
  // and say so, instead of silently storing a state Meta would reject.
  const extrasProblem =
    account.platform === 'whatsapp'
      ? outOfWindowTemplateProblem({
          outOfWindowTemplateName: oowTemplateName,
          outOfWindowTemplateLanguage: oowTemplateLanguage,
        })
      : null;

  // Dirty = any field differs from the loaded account (drives the guard).
  const dirty =
    displayName.trim() !== account.displayName ||
    status !== (account.status ?? 'active') ||
    assistantId !== currentBinding ||
    (account.platform === 'web' && originsList.join(',') !== (Array.isArray(account.config.allowed_domains) ? (account.config.allowed_domains as string[]).map(normalizeOriginEntry).filter(Boolean).join(',') : '')) ||
    (account.platform === 'web' && greeting.trim().slice(0, 500) !== (typeof account.config.greeting === 'string' ? account.config.greeting : '')) ||
    escalationNote !== (typeof account.config.escalation_note === 'string' ? account.config.escalation_note : '') ||
    escalationResolvedNote !== (typeof account.config.escalation_resolved_note === 'string' ? account.config.escalation_resolved_note : '') ||
    voiceReplies !== (account.config.voice_replies_enabled === true) ||
    oowTemplateName !== (typeof oowTemplate?.name === 'string' ? oowTemplate.name : '') ||
    oowTemplateLanguage !== (typeof oowTemplate?.language === 'string' ? oowTemplate.language : '') ||
    oowNote !== (typeof account.config.out_of_window_note === 'string' ? account.config.out_of_window_note : '') ||
    quickReplies !== quickRepliesFieldValue(account.config) ||
    csatEnabled !== (account.config.csat_enabled === true);
  const { dialog: dirtyDialog } = useDirtyGuard(dirty && canGovern, 'You have unsaved channel changes. Leaving now discards them.');

  const submit = () => {
    const config: Record<string, unknown> = {};
    if (assistantId !== currentBinding) {
      config.default_assistant_id = assistantId;
    }
    if (account.platform === 'web') {
      config.allowed_domains = originsList;
      config.greeting = greeting.trim().slice(0, 500);
    }
    // H13: only changed extras keys are sent (null clears a text key).
    Object.assign(
      config,
      buildChannelExtrasPatch(account.platform, account.config, {
        escalationNote,
        escalationResolvedNote,
        voiceRepliesEnabled: voiceReplies,
        outOfWindowTemplateName: oowTemplateName,
        outOfWindowTemplateLanguage: oowTemplateLanguage,
        outOfWindowNote: oowNote,
        quickReplies,
        csatEnabled,
      }),
    );
    update.mutate(
      {
        channelId: account.id,
        ...(displayName.trim() !== account.displayName ? { displayName: displayName.trim() } : {}),
        ...(status !== (account.status ?? 'active') ? { status: status as 'active' | 'suspended' } : {}),
        ...(Object.keys(config).length > 0 ? { config } : {}),
      },
    );
  };

  return (
    <>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>{account.displayName}</ViewTitle>
          <ViewSubtitle>Channel account settings — changes patch only what you edited.</ViewSubtitle>
        </ViewHeader>
        <HeaderMeta>
          <PlatformIcon platform={account.platform} size={22} />
          <StatusPill tone={statusTone[account.status ?? ''] ?? 'neutral'} dot={false}>
            {account.status ?? 'unknown'}
          </StatusPill>
        </HeaderMeta>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Overview" subtitle="Read-only facts about this account.">
          <FactRow>
            <FactLabel>Platform</FactLabel>
            <span><Mono>{account.platform}</Mono></span>
          </FactRow>
          <FactRow>
            <FactLabel>Health</FactLabel>
            {account.health && Object.keys(account.health).length > 0 ? (
              <span title={healthTitle(account.health)}>checked ✓</span>
            ) : (
              <Muted>—</Muted>
            )}
          </FactRow>
          {account.publicKey && (
            <FactRow>
              <FactLabel>Public key</FactLabel>
              <span><Mono>{account.publicKey}</Mono> <CopyButton value={account.publicKey} label="Copy public key" /></span>
            </FactRow>
          )}
          {account.webhookUrl && (
            <FactRow>
              <FactLabel>Webhook</FactLabel>
              <span><Mono>{account.webhookUrl}</Mono> <CopyButton value={account.webhookUrl} label="Copy webhook URL" /></span>
            </FactRow>
          )}
          {canGovern && account.platform !== 'web' ? (
            <ActionsRow>
              <Link
                to="/agent-studio/channels/$accountId/webhook-setup"
                params={{ accountId: account.id }}
                search={{ returnTo: returnTo ?? undefined, assistantId: incomingAssistantId ?? undefined }}
                style={{ fontSize: 13 }}
              >
                Webhook setup →
              </Link>
            </ActionsRow>
          ) : null}
        </Panel>
      </motion.div>

      {canGovern ? (
        <>
          <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
            <Panel title="Configuration" subtitle="Binding, status, and platform settings.">
              {extrasProblem && (
                <InlineError role="alert">{extrasProblem}</InlineError>
              )}
              <TextInput label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <FieldLabel style={{ flex: 1 }}>
                  Status
                  <FieldSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                    {status === 'pending' ? <option value="pending" disabled>pending (verify to activate)</option> : null}
                  </FieldSelect>
                </FieldLabel>
                <FieldLabel style={{ flex: 2 }}>
                  Serving assistant (re-binding re-checks routability)
                  <FieldSelect value={assistantId} onChange={(e) => setAssistantId(e.target.value)}>
                    <option value="">Unbound (legacy — new accounts always bind)</option>
                    {(assistants.data ?? []).map((assistant) => (
                      <option key={assistant.id} value={assistant.id}>{assistant.name} ({assistant.status})</option>
                    ))}
                  </FieldSelect>
                </FieldLabel>
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
              <ActionsRow>
                <ActionButton disabled={update.isPending || extrasProblem !== null || !dirty} onClick={submit}>
                  Save changes
                </ActionButton>
              </ActionsRow>
            </Panel>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
            <Panel title="Messaging extras" subtitle="Engine-consumed reply behavior per platform.">
              {/* G2: escalation notes are offered on every platform (the engine
                  persists and consumes them with no platform gate); voice/template
                  stay whatsapp-only, the out-of-window note messenger-only, and the
                  widget quick replies + CSAT control web-only (the widget plane
                  consumes them from the session bootstrap). */}
              <div style={{ marginTop: 12 }}>
                <TextInput
                  label="Escalation note (≤500)"
                  value={escalationNote}
                  onChange={(e) => setEscalationNote(e.target.value)}
                  placeholder="Connecting you with a human teammate…"
                  hint="Sent to the end user when the conversation is handed to a human. Empty clears it — the engine then uses its default line."
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <TextInput
                  label="Escalation resolved note (≤500)"
                  value={escalationResolvedNote}
                  onChange={(e) => setEscalationResolvedNote(e.target.value)}
                  placeholder="A human teammate helped — the assistant is back."
                  hint="Sent when the human hands the conversation back. Empty clears it — the engine then uses its default line."
                />
              </div>
              {account.platform === 'whatsapp' && (
                <>
                  <CheckboxLabel>
                    <input type="checkbox" checked={voiceReplies} onChange={(e) => setVoiceReplies(e.target.checked)} style={{ marginTop: 3 }} />
                    <span>
                      Voice replies
                      <CheckboxHint>
                        Also deliver assistant replies as a synthesized voice note. Best-effort — TTS must be configured, and a TTS failure never fails the text delivery.
                      </CheckboxHint>
                    </span>
                  </CheckboxLabel>
                  <SectionTitle>Out-of-window template</SectionTitle>
                  <p style={{ fontSize: 12, opacity: 0.7 }}>
                    WhatsApp template used when the 24h messaging window is closed. Fill in both fields, or leave both empty to clear.
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 2 }}>
                      <TextInput label="Template name" value={oowTemplateName} onChange={(e) => setOowTemplateName(e.target.value)} placeholder="hello_world" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <TextInput label="Language" value={oowTemplateLanguage} onChange={(e) => setOowTemplateLanguage(e.target.value)} placeholder="en_US" />
                    </div>
                  </div>
                </>
              )}
              {account.platform === 'messenger' && (
                <div style={{ marginTop: 12 }}>
                  <TextInput
                    label="Out-of-window note (≤500)"
                    value={oowNote}
                    onChange={(e) => setOowNote(e.target.value)}
                    placeholder="Our team replies within a day…"
                    hint="Sent as the reply when the 24h window is closed (Messenger has no template mechanism). Empty clears it."
                  />
                </div>
              )}
              {account.platform === 'web' && (
                <>
                  <div style={{ marginTop: 12 }}>
                    <TextArea
                      label="Quick replies (one per line)"
                      name="quickReplies"
                      value={quickReplies}
                      onChange={(e) => setQuickReplies(e.target.value)}
                      rows={3}
                      placeholder={'Book a demo\nSee pricing'}
                      hint="Up to 6 chips, 64 chars each — rendered beside the widget composer. Empty clears them."
                    />
                  </div>
                  <CheckboxLabel>
                    <input type="checkbox" checked={csatEnabled} onChange={(e) => setCsatEnabled(e.target.checked)} style={{ marginTop: 3 }} />
                    <span>
                      CSAT feedback
                      <CheckboxHint>
                        Show the thumbs up/down control in the widget and collect reply ratings. Feedback is never collected unless this is on.
                      </CheckboxHint>
                    </span>
                  </CheckboxLabel>
                </>
              )}
              <ActionsRow>
                <ActionButton disabled={update.isPending || extrasProblem !== null || !dirty} onClick={submit}>
                  Save changes
                </ActionButton>
              </ActionsRow>
            </Panel>
          </motion.div>

          {account.platform !== 'web' && (
            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
              <RotateCredentialsSection account={account} />
            </motion.div>
          )}

          <motion.div initial="hidden" animate="visible" variants={pageItem} custom={5}>
            <Panel title="Danger zone" subtitle="Irreversible actions.">
              <DangerText>
                Deactivating destroys the sealed credentials — it is not a pause. Reconnecting means re-sealing. History stays in audit.
              </DangerText>
              <ActionsRow>
                <ActionButton
                  variant="danger"
                  disabled={deactivate.isPending}
                  onClick={() => setConfirmDeactivate(true)}
                >
                  Deactivate this channel
                </ActionButton>
              </ActionsRow>
            </Panel>
          </motion.div>
        </>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
          <Panel title="Configuration" subtitle="Read-only for your role.">
            <p style={{ fontSize: 13 }}><Muted>{governDenied}</Muted></p>
          </Panel>
        </motion.div>
      )}

      <ConfirmDialog
        open={confirmDeactivate}
        title="Deactivate this channel?"
        message={`“${account.displayName}” stops serving AND its sealed credentials are destroyed — reconnecting means re-sealing. History stays in audit.`}
        destructive
        confirmLabel="Deactivate"
        onConfirm={() => {
          setConfirmDeactivate(false);
          deactivate.mutate(account.id, {
            onSuccess: () => navigate({ to: '/agent-studio/channels', search: { returnTo: undefined, assistantId: undefined } }),
          });
        }}
        onCancel={() => setConfirmDeactivate(false)}
      />
      {dirtyDialog}
    </>
  );
}

/**
 * Inline expanding credential rotation — Apple Settings pattern, not a
 * route. Same H3 pre-validation as the old RotateModal: a malformed secret
 * is blocked here instead of failing the server-side shape check.
 */
function RotateCredentialsSection({ account }: { account: ChannelAccount }) {
  const rotate = useRotateChannelCredentials();
  const spec = PLATFORM_CREDENTIAL_SPECS.find((s) => s.platform === account.platform);
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  // Unsaved credential input is guarded like every other form: navigating
  // away with typed secrets discards them (Cancel clears explicitly).
  const { dialog: rotateDirtyDialog } = useDirtyGuard(
    expanded && Object.values(values).some((v) => v.trim() !== ''),
    'You have unsaved credential input. Leaving now discards it.',
  );

  if (!spec || spec.fields.length === 0) {
    return null;
  }

  const missing = spec.fields.filter((field) => !(values[field.key]?.trim()));
  const formatProblems = spec.fields
    .map((field) => validateCredentialField(field, values[field.key] ?? ''))
    .filter((p): p is string => p !== null);

  return (
    <>
      {rotateDirtyDialog}
    <Panel title="Credentials" subtitle="Sealed on arrival, never shown.">
      {!expanded ? (
        <ActionsRow style={{ marginTop: 0 }}>
          <ActionButton variant="secondary" onClick={() => setExpanded(true)}>
            Rotate credentials…
          </ActionButton>
        </ActionsRow>
      ) : (
        <>
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
          {missing.length > 0 && <InlineError>All credential fields are required for rotation.</InlineError>}
          {formatProblems.length > 0 && (
            <ul style={{ fontSize: 12, color: '#f87171', paddingLeft: 18 }}>
              {formatProblems.map((problem, i) => (
                <li key={i}>{problem}</li>
              ))}
            </ul>
          )}
          <ActionsRow>
            <ActionButton variant="secondary" onClick={() => { setExpanded(false); setValues({}); }}>
              Cancel
            </ActionButton>
            <ActionButton
              disabled={missing.length > 0 || formatProblems.length > 0 || rotate.isPending}
              onClick={() => {
                const credentials: Record<string, unknown> = {};
                for (const field of spec.fields) {
                  credentials[field.key] = (values[field.key] ?? '').trim();
                }
                rotate.mutate(
                  { channelId: account.id, credentials },
                  { onSuccess: () => { setExpanded(false); setValues({}); } },
                );
              }}
            >
              Rotate (re-seals immediately)
            </ActionButton>
          </ActionsRow>
        </>
      )}
    </Panel>
    </>
  );
}
