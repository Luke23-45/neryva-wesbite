import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { Panel } from '@components/common/ui/Panel';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import {
  useLinkConnector,
  buildConnectorConfig,
  singleFieldOverflowNote,
  validateCredentialShape,
  PROVIDER_LINK_SPECS,
  CONNECTOR_PROVIDERS,
  type ConnectorProvider,
} from '@hooks/studio/useSetupConnectors';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { ProviderIcon } from './ProviderIcon';

const LogoTile = styled.div`
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: ${({ theme }) => theme.app.text.primary};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  flex-shrink: 0;
`;

const FieldBlock = styled.div`
  margin-top: 12px;
`;

const Hint = styled.p`
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
`;

const Error = styled.p`
  font-size: 12px;
  color: #f87171;
  margin-top: 4px;
`;

const CandidateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
`;

const ReviewRow = styled.div`
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  font-size: ${({ theme }) => theme.app.type.body};

  &:last-child {
    border-bottom: 0;
  }
`;

const ReviewKey = styled.div`
  width: 140px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const ReviewValue = styled.div`
  color: ${({ theme }) => theme.app.text.primary};
  word-break: break-word;
`;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

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

/**
 * Link a provider account — dedicated section replacing LinkModal.
 * Validation is byte-identical to the modal version; the review summary
 * never echoes sealed credentials (presence-only).
 */
export function LinkProviderSection() {
  const { provider } = useParams({ from: '/agent-studio/integrations/link/$provider' });
  const navigate = useNavigate();
  const { role } = useOrg();
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const link = useLinkConnector();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const spec = PROVIDER_LINK_SPECS.find((s) => s.provider === (provider as ConnectorProvider)) ?? null;

  const [displayName, setDisplayName] = useState('');
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState('');
  const [pageUrl, setPageUrl] = useState('');

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Unknown provider → back to the list. No write right → back to the list
  // (server gates the POST too).
  useEffect(() => {
    if (!spec || !canWrite) {
      navigate({ to: '/agent-studio/integrations' });
    }
  }, [spec, canWrite, navigate]);

  // Dirty guard: block navigation while the form holds unlinked content.
  const dirty =
    displayName.trim() !== '' || pageUrl.trim() !== '' || credentials.trim() !== '' || Object.values(configValues).some((v) => v.trim() !== '');
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unlinked provider. Leaving now discards it.');

  if (!spec || !canWrite) {
    return null;
  }

  // Sitemap locator (G9): marketers paste a page URL, not an XML path. We
  // suggest the conventional locations for the user to CONFIRM (open it) —
  // the browser cannot probe them (CORS), and the first sync validates.
  const sitemapCandidates = (() => {
    if (spec.provider !== 'sitemap') {
      return [];
    }
    try {
      const origin = new URL(pageUrl.trim()).origin;
      return [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/sitemap-index.xml`];
    } catch {
      return [];
    }
  })();

  const missingConfig = spec.configFields.filter((f) => f.required && !configValues[f.key]?.trim());
  const needsCredentials = spec.credentials === 'secret-required' || spec.credentials === 'msal-cc';
  const credentialsProblem =
    spec.credentials === 'dance-only' && credentials.trim()
      ? 'Drive binds tokens via the OAuth dance — link without credentials, then authorize.'
      : needsCredentials && credentials.trim().length < 4
        ? 'A credential is required here: this provider has no dance, and linked-without-credential accounts cannot sync or be repaired (no credential-update endpoint exists).'
        : spec.credentials === 'msal-cc' && credentials.trim()
          ? validateMsalCc(credentials)
          : // I14/I15: confluence/zendesk pastes must carry the engine's
            // separator (email:api_token / email/api_token) — a bare token
            // is blocked here; it would fail every sync with a 401 if it ever linked.
            validateCredentialShape(spec, credentials);

  const valid = displayName.trim() !== '' && missingConfig.length === 0 && !credentialsProblem;

  const submit = () => {
    if (!valid || link.isPending) {
      return;
    }
    const name = displayName.trim();
    link.mutate(
      {
        provider: spec.provider,
        displayName: name,
        // P1-decision: singular `single` fields keep only the first value
        // (Zendesk locale); extras are disclosed, never silently kept.
        config: buildConnectorConfig(spec, configValues),
        ...(spec.credentials !== 'none' && spec.credentials !== 'dance-only' && credentials.trim() ? { credentials: credentials.trim() } : {}),
      },
      {
        onSuccess: (data) => {
          const id = (data as { connector?: { id?: string } } | null)?.connector?.id;
          toast.success(`Linked ${name}`);
          navigate({
            to: '/agent-studio/integrations',
            search: id ? { linked: id } : undefined,
          });
        },
      },
    );
  };

  const credentialSummary =
    spec.credentials === 'none'
      ? 'None required'
      : spec.credentials === 'dance-only'
        ? 'OAuth dance after linking'
        : credentials.trim()
          ? 'sealed ✓ — provided, never shown again'
          : 'none provided — linking will be blocked until one is pasted';

  return (
    <ViewShell>
      {dirtyDialog}
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <SectionBackRow to="/agent-studio/integrations">
          <span aria-hidden="true">‹</span> All integrations
        </SectionBackRow>
      </motion.div>

      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <LogoTile aria-hidden="true">
          <ProviderIcon provider={spec.provider} />
        </LogoTile>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Link {spec.label}</ViewTitle>
          <ViewSubtitle>{spec.blurb}</ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel title="Configuration" subtitle="Credentials seal on arrival and never render again.">
          <TextInput label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={`e.g. ${spec.label} docs`} autoFocus />
          {spec.provider === 'sitemap' && (
            <FieldBlock>
              <TextInput
                label="Find your sitemap — paste any page URL"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                placeholder="https://docs.company.com/handbook"
                hint="Pick the candidate that opens as XML — the first sync validates it."
              />
              {sitemapCandidates.length > 0 && (
                <CandidateList>
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
                </CandidateList>
              )}
            </FieldBlock>
          )}
          {spec.configFields.map((field) => {
            // P1-decision: if a single-value field ever held multiples, say so —
            // the extras are discarded at submit, not silently kept.
            const overflowNote = singleFieldOverflowNote(field, configValues[field.key] ?? '');
            return (
              <FieldBlock key={field.key}>
                <TextInput
                  label={`${field.label}${field.required ? ' (required)' : ''}`}
                  value={configValues[field.key] ?? ''}
                  onChange={(e) => setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  hint={field.hint}
                  error={field.required && !configValues[field.key]?.trim() ? 'Required for sync.' : undefined}
                />
                {overflowNote && <Hint>{overflowNote}</Hint>}
              </FieldBlock>
            );
          })}
          {spec.credentials !== 'none' && spec.credentials !== 'dance-only' && (
            <FieldBlock>
              <TextArea
                label={spec.credentials === 'msal-cc' ? 'msal-cc JSON bundle' : 'Credential (sealed on arrival — never shown again)'}
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                rows={spec.credentials === 'msal-cc' ? 4 : 2}
                placeholder={spec.credentials === 'msal-cc' ? '{"client_id": "…", "tenant": "…", "secret": "…"}' : 'Paste the token'}
              />
              {credentialsProblem && <Error>{credentialsProblem}</Error>}
            </FieldBlock>
          )}
          <Hint>{spec.credentialsHint}</Hint>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
        <div style={{ marginTop: 18 }}>
          <Panel title="Review" subtitle="What will be linked. Sealed credentials are never echoed here.">
            <ReviewRow>
              <ReviewKey>Provider</ReviewKey>
              <ReviewValue>{spec.label}</ReviewValue>
            </ReviewRow>
            <ReviewRow>
              <ReviewKey>Display name</ReviewKey>
              <ReviewValue>{displayName.trim() || <span style={{ opacity: 0.55 }}>—</span>}</ReviewValue>
            </ReviewRow>
            {spec.configFields.map((field) => (
              <ReviewRow key={field.key}>
                <ReviewKey>{field.label}</ReviewKey>
                <ReviewValue>
                  {configValues[field.key]?.trim() ? <Mono>{configValues[field.key].trim()}</Mono> : <span style={{ opacity: 0.55 }}>—</span>}
                </ReviewValue>
              </ReviewRow>
            ))}
            <ReviewRow>
              <ReviewKey>Credentials</ReviewKey>
              <ReviewValue>{credentialSummary}</ReviewValue>
            </ReviewRow>
            <ActionRow>
              <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/integrations' })} title={writeDenied}>
                Cancel
              </ActionButton>
              <ActionButton disabled={!valid || link.isPending} onClick={submit} title={canWrite ? `Link a ${spec.label} account` : writeDenied}>
                Link account
              </ActionButton>
            </ActionRow>
          </Panel>
        </div>
      </motion.div>
    </ViewShell>
  );
}

// Re-exported so tests can assert the param whitelist without rendering.
export const LINKABLE_PROVIDERS = CONNECTOR_PROVIDERS;
