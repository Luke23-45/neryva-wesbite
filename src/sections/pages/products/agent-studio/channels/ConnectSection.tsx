import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plug } from 'lucide-react';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import {
  useCreateChannel,
  validateCredentialField,
  normalizeOriginEntry,
  PLATFORM_CREDENTIAL_SPECS,
  type ConnectablePlatform,
} from '@hooks/studio/useSetupChannels';
import { useAssistants } from '@hooks/studio/useAssistants';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { PlatformIcon } from './platformIcons';

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

const Blurb = styled.p`
  font-size: 12px;
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProblemList = styled.ul`
  font-size: 12px;
  color: #f87171;
  padding-left: 18px;
`;

const InlineError = styled.p`
  font-size: 12px;
  color: #f87171;
`;

const Hint = styled.p`
  font-size: 12px;
  opacity: 0.7;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

/**
 * Connect a channel — dedicated section replacing ConnectModal (C-1).
 * Validation byte-identical to the modal version (H3/H5 rules preserved).
 * C14 publish-exit contract: ?returnTo= + ?assistantId= are honored —
 * after connecting the user returns to the agent, never a dead end.
 */
export function ConnectSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  // C14: search is validated on the parent layout route and inherited here.
  const search = useSearch({ from: '/agent-studio/channels/connect' });
  const returnTo = typeof search.returnTo === 'string' && search.returnTo.startsWith('/agent-studio/') ? search.returnTo : null;
  const incomingAssistantId = typeof search.assistantId === 'string' && search.assistantId !== '' ? search.assistantId : null;
  const canGovern = canSetup(role, 'setup:govern');

  const create = useCreateChannel();
  const assistants = useAssistants();
  const [platform, setPlatform] = useState<ConnectablePlatform>('web');
  const [displayName, setDisplayName] = useState('');
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
  const [assistantId, setAssistantId] = useState(incomingAssistantId ?? '');
  const [origins, setOrigins] = useState('');
  const [greeting, setGreeting] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const spec = PLATFORM_CREDENTIAL_SPECS.find((s) => s.platform === platform) ?? PLATFORM_CREDENTIAL_SPECS[3];

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Dirty guard: block navigation while the form has unsent content.
  const dirty =
    displayName.trim() !== '' ||
    Object.values(credentialValues).some((v) => v !== '') ||
    assistantId !== (incomingAssistantId ?? '') ||
    origins.trim() !== '' ||
    greeting.trim() !== '';
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent channel connection. Leaving now discards it.');

  // Non-govern users land here directly — bounce to the list (server gates too).
  useEffect(() => {
    if (!canGovern) {
      navigate({ to: '/agent-studio/channels', search: { returnTo: undefined, assistantId: undefined } });
    }
  }, [canGovern, navigate]);

  if (!canGovern) {
    return null;
  }

  // H5: entries are normalized to scheme://host[:port] — a pasted path
  // (https://acme.com/docs) is stripped client-side instead of failing the
  // engine's assertAllowedDomainFormat with a toast.
  const originsList = origins.split(',').map(normalizeOriginEntry).filter(Boolean);
  const originsProblem = platform === 'web' && originsList.length === 0 ? 'Web channels require at least one origin (scheme://host).' : null;
  const nameProblem = !displayName.trim() ? 'Display name is required.' : null;
  const assistantProblem = !assistantId ? 'Binding is required — channel conversations pin this assistant (routability-checked).' : null;
  // H3: non-empty is not enough — app_secret must be 64 hex and bot_token
  // must match 123456:token, mirroring the engine's assertCredentialsShape.
  const credentialProblems = spec.fields
    .map((field) => {
      const value = credentialValues[field.key]?.trim() ?? '';
      if (!value) {
        return `${field.label} is required.`;
      }
      return validateCredentialField(field, value);
    })
    .filter((p): p is string => p !== null);

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
          if (returnTo) {
            navigate({ to: returnTo });
          } else {
            navigate({ to: '/agent-studio/channels', search: { returnTo: undefined, assistantId: undefined } });
          }
        },
      },
    );
  };

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/channels">
        <span aria-hidden="true">‹</span> Channels
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Connect a channel</ViewTitle>
          <ViewSubtitle>
            Credentials seal on arrival and never render. The channel starts pending — verify it, then set up the webhook.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Platform" subtitle="Only credentialable platforms are offered.">
          <FieldLabel>
            Platform
            <FieldSelect value={platform} onChange={(e) => { setPlatform(e.target.value as ConnectablePlatform); setCredentialValues({}); }}>
              {PLATFORM_CREDENTIAL_SPECS.map((s) => (
                <option key={s.platform} value={s.platform}>{s.label}</option>
              ))}
            </FieldSelect>
          </FieldLabel>
          <Blurb><PlatformIcon platform={platform} size={20} /> {spec.blurb}</Blurb>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel title="Details" subtitle="Name, credentials, and the assistant this channel serves.">
          <div>
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
            <Hint>Keyless — the engine generates the public key on connect.</Hint>
          )}
          <FieldLabel style={{ marginTop: 12 }}>
            Serving assistant (required)
            <FieldSelect value={assistantId} onChange={(e) => setAssistantId(e.target.value)}>
              <option value="">Pick the assistant this channel serves…</option>
              {(assistants.data ?? []).map((assistant) => (
                <option key={assistant.id} value={assistant.id}>{assistant.name} ({assistant.status})</option>
              ))}
            </FieldSelect>
          </FieldLabel>
          {assistantProblem && <InlineError>{assistantProblem}</InlineError>}
          {returnTo && !assistantProblem && (
            <Hint>After connecting you return to the agent.</Hint>
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
            <ProblemList>
              {problems.map((problem, i) => (
                <li key={i}>{problem}</li>
              ))}
            </ProblemList>
          )}
          <ActionsRow>
            <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/channels', search: { returnTo: undefined, assistantId: undefined } })}>
              Cancel
            </ActionButton>
            <ActionButton disabled={problems.length > 0 || create.isPending} onClick={submit}>
              <Plug size={13} strokeWidth={1.8} />
              Connect (starts pending)
            </ActionButton>
          </ActionsRow>
        </Panel>
      </motion.div>
      {dirtyDialog}
    </ViewShell>
  );
}
