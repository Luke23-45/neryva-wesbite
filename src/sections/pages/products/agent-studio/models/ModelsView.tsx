import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from '@tanstack/react-router';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { KeyRound, Trash2, RefreshCw, Lock, Fingerprint, ShieldCheck, Info } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Switch } from '@components/common/ui/Switch';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Segmented } from '@components/common/ui/Segmented';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useModelAvailability, useModelCosts, costLabel } from '@hooks/studio/useSetupModels';
import {
  useProviderCredentials,
  useRevokeProviderCredential,
  useProviderEnablements,
  useSetProviderEnablement,
  MODEL_PROVIDERS,
} from '@hooks/studio/useSetupProviders';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useEnterpriseStatus } from '@hooks/engine/billing';
import { useOrg } from '@/Context/OrgContext';

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

const ReasonList = styled.ul`
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
`;

const Note = styled.p`
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.8;
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

type Tab = 'catalog' | 'providers';

/** Display names for provider slugs (SVG reference). */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  'openai': 'OpenAI',
  'anthropic': 'Anthropic',
  'google': 'Google',
  'azure-openai': 'Azure OpenAI',
  'amazon-bedrock': 'Amazon Bedrock',
  'mistral': 'Mistral',
  'xai': 'xAI',
  'deepseek': 'DeepSeek',
  'openrouter': 'OpenRouter',
  'ollama': 'Ollama',
};

const providerDisplayName = (slug: string): string =>
  PROVIDER_DISPLAY_NAMES[slug] ?? slug;

/* ── Provider enablements hero card ──────────────────────────── */

const EnablementsCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.base};
  overflow: hidden;
`;

const EnablementsHeader = styled.div`
  padding: 20px 24px 16px;
`;

const EnablementsTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
`;

const EnablementsTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const EnablementsSubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const EnablementsSummary = styled.span`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const GreenDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34c759;
  flex-shrink: 0;
`;

const ProviderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  border-top: 1px solid ${({ theme }) => theme.app.border.subtle};

  &:hover {
    background: ${({ theme }) => theme.app.surface.subtle};
  }
`;

const ProviderInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProviderName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  margin-bottom: 2px;
`;

const ProviderMeta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const EnablementsFootnote = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.muted};
`;

/* ── BYOK gate panel ─────────────────────────────────────────── */

const GatePanel = styled.div`
  padding: 48px 24px;
  text-align: center;
`;

const GateIconWrap = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.active};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  margin-bottom: 20px;
  color: ${({ theme }) => theme.app.text.link};
`;

const GateTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const GateDesc = styled.p`
  margin: 0 0 4px;
  font-size: 13px;
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.muted};
`;

const GateSub = styled.p`
  margin: 0 0 20px;
  font-size: 12.5px;
  color: ${({ theme }) => theme.app.text.faint};
`;

const EnterpriseBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 10px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.status.info.bg};
  border: 1px solid ${({ theme }) => theme.app.status.info.border};
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: ${({ theme }) => theme.app.status.info.fg};
`;

/* ── Policy fact strip ───────────────────────────────────────── */

const PolicyStrip = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const PolicyStep = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 20px 24px;

  & + & {
    border-left: 1px solid ${({ theme }) => theme.app.border.default};

    @media (max-width: 720px) {
      border-left: none;
      border-top: 1px solid ${({ theme }) => theme.app.border.default};
    }
  }
`;

const PolicyIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.active};
  color: ${({ theme }) => theme.app.text.muted};
  flex-shrink: 0;
`;

const PolicyTitle = styled.h4`
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const PolicyDesc = styled.div`
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.muted};
`;

/**
 * Gap #7 (console field audit): the engine sends `required_product(_label)` on
 * every catalog row "so the UI can name the tier that unlocks the model" —
 * render it on `subscription_required` rows instead of a bare "unusable" pill.
 * Pure so the fallback chain (label → product → generic) is pinnable.
 */
export function subscriptionRequirementCopy(
  requiredProductLabel: string | null,
  requiredProduct: string | null,
): string {
  return ` — requires ${requiredProductLabel ?? requiredProduct ?? 'a higher-tier'} subscription.`;
}

/**
 * Gap #10 (console field audit): the engine rejects secrets outside 8..4096
 * chars AFTER the MFA proof (`provider-credentials.service` `assertSecret`).
 * Validate against what we send (the trimmed value) before the proof so the
 * refusal happens client-side. Returns the blocking message, or null when the
 * value is fine — empty is reported as null because the modal's required
 * check owns the empty case.
 */
export function validateCredentialSecret(secret: string): string | null {
  const trimmed = secret.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length < 8 || trimmed.length > 4096) return 'Secret must be 8–4096 characters.';
  return null;
}

/**
 * Gap #13 (console field audit): builds the revoke mutation input — the
 * optional incident `reason` (≤512) is recorded on the credential row and
 * `compromised: true` pages owner/admin. Never sends empty or omitted keys.
 */
export function buildRevokeInput(
  credentialId: string,
  reason: string,
  compromised: boolean,
): { credentialId: string; reason?: string; compromised?: true } {
  const trimmed = reason.trim();
  return {
    credentialId,
    ...(trimmed ? { reason: trimmed } : {}),
    ...(compromised ? { compromised: true as const } : {}),
  };
}

export function ModelsView() {
  const { role } = useOrg();
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');
  // BYOK enterprise gate (P1-5): the engine 403s provider-credential
  // create() for orgs without an active enterprise commitment
  // (BYOK_ENTERPRISE_ONLY), so the console gates the add flow here —
  // BEFORE the MFA step-up — instead of directing users into a flow
  // that can only end in 403. Unknown state (loading/error) fails open
  // toward the legacy copy: the engine stays the backstop, and a
  // transient status read never locks an enterprise org out of its
  // own credentials.
  // NG-MT-2: gate the read on the credential-read capability (the same
  // owner/admin/developer set CredentialsPanel uses for this exact hook —
  // here that's `canWrite`, also used for useProviderCredentials below).
  // The engine 403s enterprise/status for every other role, so readers
  // fired a doomed 403 (+3 retries) on this page before this gate. Roles
  // without the capability fall back to the legacy copy, exactly like an
  // unknown read — the engine stays the backstop.
  const enterprise = useEnterpriseStatus({ enabled: canWrite });
  const byokBlocked = enterprise.data === false;
  const [tab, setTab] = useState<Tab>('catalog');
  const models = useModelAvailability();
  const costs = useModelCosts();
  const costByRef = useMemo(() => {
    const map = new Map<string, { in: string; out: string }>();
    for (const cost of costs.data ?? []) {
      map.set(cost.ref, { in: costLabel(cost, 'in'), out: costLabel(cost, 'out') });
    }
    return map;
  }, [costs.data]);

  const usable = useMemo(() => (models.data ?? []).filter((m) => m.usable).length, [models.data]);
  const total = useMemo(() => models.data?.length ?? 0, [models.data]);

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Providers & Models</ViewTitle>
          <ViewSubtitle>
            Live catalog availability and org-level provider control — drafts advise, publish enforces.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1} style={{ marginBottom: 14 }}>
        <Segmented
          options={[
            { value: 'catalog' as const, label: `Catalog${total > 0 ? ` (${usable}/${total})` : ''}` },
            { value: 'providers' as const, label: 'Providers' },
          ]}
          value={tab}
          onChange={setTab}
          size="sm"
          ariaLabel="Providers and models view"
        />
      </motion.div>

      {tab === 'catalog' ? (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
          <Panel title="Model catalog" subtitle="Published allowlist · org enablements · credentials · residency. Prices are list ($/1k tokens); unpriced never implies free.">
            <QueryView
              query={models}
              isEmpty={(d) => d.length === 0}
              empty={{ title: 'No models published', description: 'The platform catalog has no entries yet — versions require a picked model, so nothing can ship until staff publishes the catalog. Contact support if this persists.' }}
            >
              {(rows) => (
                <DataTable>
                  <DataHead>
                    <DataCell $w="24%">Model</DataCell>
                    <DataCell $w="16%">Reference</DataCell>
                    <DataCell $w="12%">Context / output</DataCell>
                    <DataCell $w="10%">Residency</DataCell>
                    <DataCell $w="12%">List price in/out</DataCell>
                    <DataCell $w="26%">Availability</DataCell>
                  </DataHead>
                  {rows.map((model, i) => (
                    <DataRow key={model.ref} as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={i + 3} $interactive={false}>
                      <DataCell $w="24%">{model.displayName}</DataCell>
                      <DataCell $w="16%">
                        <Mono>{model.ref}</Mono>
                      </DataCell>
                      <DataCell $w="12%">
                        {model.contextWindowTokens !== null ? `${(model.contextWindowTokens / 1000).toFixed(0)}k` : '—'}
                        {' / '}
                        {model.maxOutputTokens !== null ? `${(model.maxOutputTokens / 1000).toFixed(0)}k` : '—'}
                      </DataCell>
                      <DataCell $w="10%">{model.residency ? <Mono>{model.residency}</Mono> : <Muted>—</Muted>}</DataCell>
                      <DataCell $w="12%">
                        {(() => {
                          const price = costByRef.get(model.ref);
                          return price ? <span><Mono>{price.in}</Mono> / <Mono>{price.out}</Mono></span> : <Muted>unpriced</Muted>;
                        })()}
                      </DataCell>
                      <DataCell $w="26%">
                        {model.usable ? (
                          <StatusPill tone="success" dot={false}>usable</StatusPill>
                        ) : (
                          <>
                            <StatusPill tone="warning" dot={false}>unusable</StatusPill>
                            <ReasonList>
                              {model.reasons.map((reason) => (
                                <li key={reason}>
                                  <Mono>{reason}</Mono>
                                  {reason === 'provider_credential_missing' &&
                                    (byokBlocked ? (
                                      <>
                                        {' — BYOK is an Enterprise feature. '}
                                        <Link to="/agent-studio/settings/billing">View subscription options →</Link>
                                      </>
                                    ) : (
                                      ' — add BYOK in Providers.'
                                    ))}
                                  {reason === 'provider_not_enabled' && ' — enable the provider below.'}
                                  {reason === 'residency_incompatible' && ' — outside the org residency pin.'}
                                  {/*
                                    Gap #7 (console field audit): the engine sends
                                    required_product(_label) on every row and the hook
                                    parses it "so the UI can name the tier that unlocks
                                    the model" — but the UI never rendered it. Name it.
                                  */}
                                  {reason === 'subscription_required' &&
                                    subscriptionRequirementCopy(model.requiredProductLabel, model.requiredProduct)}
                                </li>
                              ))}
                              {model.reasons.length === 0 && <li><Muted>no reason given</Muted></li>}
                            </ReasonList>
                          </>
                        )}
                      </DataCell>
                    </DataRow>
                  ))}
                </DataTable>
              )}
            </QueryView>
          </Panel>
          <SectionGap>
            <Panel title="Residency" subtitle="Org pin: default (permissive) or eu (strict, fail-closed).">
              <Note>
                Publish refuses models the org residency does not serve (<Mono>residency not served by catalog models</Mono>).
                The pin itself is govern-plane configuration — this surface shows per-model residency tags so makers pick servable
                models; the refusal (when it triggers) renders verbatim with the uncovered models named.
              </Note>
            </Panel>
          </SectionGap>
        </motion.div>
      ) : (
        <ProvidersTab canWrite={canWrite} writeDenied={writeDenied} canGovern={canGovern} governDenied={governDenied} byokBlocked={byokBlocked} />
      )}
    </ViewShell>
  );
}

function ProvidersTab({ canWrite, writeDenied, canGovern, governDenied, byokBlocked }: { canWrite: boolean; writeDenied: string; canGovern: boolean; governDenied: string; byokBlocked: boolean }) {
  const navigate = useNavigate();
  // Credential reads are owner/admin/developer — readers/billing get the
  // denied panel, never a 403 flash (the server enforces regardless).
  const credentials = useProviderCredentials({ enabled: canWrite });
  const enablements = useProviderEnablements();
  const setEnablement = useSetProviderEnablement();
  const revokeCredential = useRevokeProviderCredential();

  const [revokeTarget, setRevokeTarget] = useState<{ id: string; label: string } | null>(null);
  // Gap #13 (console field audit): the revoke endpoint accepts an optional
  // incident `reason` (≤512, documented on the row) and an explicit
  // `compromised: true` (pages owner/admin). The dialog collected neither,
  // so the console could never trigger the compromised-incident path.
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeCompromised, setRevokeCompromised] = useState(false);
  const closeRevoke = () => {
    setRevokeTarget(null);
    setRevokeReason('');
    setRevokeCompromised(false);
  };

  const enabledByProvider = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const row of enablements.data ?? []) {
      map.set(row.provider, row.enabled);
    }
    return map;
  }, [enablements.data]);

  // Credential source per provider: BYOK fingerprint when a credential
  // exists, otherwise Studio-managed.
  const credentialByProvider = useMemo(() => {
    const map = new Map<string, { fingerprint: string | null }>();
    for (const cred of credentials.data ?? []) {
      if (cred.status !== 'revoked') {
        map.set(cred.provider, { fingerprint: cred.secretFingerprint });
      }
    }
    return map;
  }, [credentials.data]);

  const enabledCount = useMemo(
    () => MODEL_PROVIDERS.filter((p) => enabledByProvider.get(p) ?? true).length,
    [enabledByProvider],
  );

  if (!canWrite) {
    return (
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel title="Provider credentials (BYOK)" subtitle="Fingerprint-only list.">
          <EmptyState icon={<KeyRound size={18} opacity={0.5} />} title="Restricted" description={writeDenied} />
        </Panel>
      </motion.div>
    );
  }

  return (
    <>
      {/* ── Card A: Provider enablements (primary) ── */}
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <EnablementsCard>
          <EnablementsHeader>
            <EnablementsTitleRow>
              <EnablementsTitle>Provider enablements</EnablementsTitle>
              <EnablementsSummary>
                <GreenDot aria-hidden="true" />
                {MODEL_PROVIDERS.length} providers · {enabledCount} enabled
              </EnablementsSummary>
            </EnablementsTitleRow>
            <EnablementsSubtitle>Org-level availability switches for every model provider.</EnablementsSubtitle>
          </EnablementsHeader>

          <QueryView query={enablements} skeleton={undefined} isEmpty={() => false} empty={{ title: '', description: '' }}>
            {() => (
              <div>
                <div style={{ display: 'flex', padding: '8px 24px', background: 'var(--app-surface-subtle)', borderTop: '1px solid var(--app-border-default)' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: 'var(--app-text-muted)' }}>PROVIDER</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: 'var(--app-text-muted)' }}>ENABLED</span>
                </div>
                {MODEL_PROVIDERS.map((provider) => {
                  const enabled = enabledByProvider.get(provider) ?? true;
                  const cred = credentialByProvider.get(provider);
                  const source = cred
                    ? (cred.fingerprint ? `BYOK · ${cred.fingerprint.slice(0, 12)}…` : 'BYOK')
                    : 'Studio-managed key';
                  return (
                    <ProviderRow key={provider}>
                      <ProviderInfo>
                        <ProviderName>{providerDisplayName(provider)}</ProviderName>
                        <ProviderMeta>
                          <Mono>{provider}</Mono> · {source}
                        </ProviderMeta>
                      </ProviderInfo>
                      <span title={canGovern ? `Toggle ${provider}` : governDenied}>
                        <Switch
                          checked={enabled}
                          disabled={!canGovern || setEnablement.isPending}
                          aria-label={`Enable ${providerDisplayName(provider)}`}
                          onChange={(next) => {
                            if (!next) {
                              toast(`Disabling ${providerDisplayName(provider)} flips its models to provider_not_enabled.`);
                            }
                            setEnablement.mutate({ provider, enabled: next });
                          }}
                        />
                      </span>
                    </ProviderRow>
                  );
                })}
              </div>
            )}
          </QueryView>

          <EnablementsFootnote>
            <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Providers without a row default to on. Disabling flips dependent models to provider_not_enabled — drafts advise, publish enforces.
            </span>
          </EnablementsFootnote>
        </EnablementsCard>
      </motion.div>

      {/* ── Card B: BYOK credentials ── */}
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
        <SectionGap>
          <Panel
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                Provider credentials (BYOK)
                <EnterpriseBadge>ENTERPRISE</EnterpriseBadge>
              </span>
            }
            subtitle="Fingerprint-only keys that override Studio-managed credentials per provider."
            action={
              byokBlocked ? undefined : (
                <ActionButton size="sm" disabled={!canGovern} title={canGovern ? 'Add a provider credential' : governDenied} onClick={() => navigate({ to: '/agent-studio/models/credentials/new' })}>
                  <KeyRound size={13} strokeWidth={1.8} />
                  Add credential
                </ActionButton>
              )
            }
          >
            {byokBlocked ? (
              <GatePanel>
                <GateIconWrap>
                  <Lock size={20} strokeWidth={1.6} />
                </GateIconWrap>
                <GateTitle>BYOK is an Enterprise feature</GateTitle>
                <GateDesc>
                  This org has no active enterprise commitment, so the add-credential flow is turned off.
                </GateDesc>
                <GateSub>Plan and billing details live in Settings → Billing.</GateSub>
                <ActionButton
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate({ to: '/agent-studio/settings/billing' })}
                >
                  View subscription options
                </ActionButton>
              </GatePanel>
            ) : (
              <QueryView
                query={credentials}
                isEmpty={(d) => d.length === 0}
                empty={{ title: 'No BYOK credentials', description: 'Models without provider keys surface provider_credential_missing in the catalog.' }}
              >
                {(rows) => (
                  <DataTable>
                    <DataHead>
                      <DataCell $w="18%">Provider</DataCell>
                      <DataCell $w="20%">Label</DataCell>
                      <DataCell $w="16%">Fingerprint</DataCell>
                      <DataCell $w="12%">Status</DataCell>
                      <DataCell $w="14%">Rotated</DataCell>
                      <DataCell $w="20%" $align="right">Actions</DataCell>
                    </DataHead>
                    {rows.map((cred) => (
                      <DataRow key={cred.id} $interactive={false}>
                        <DataCell $w="18%">
                          <Mono>{cred.provider}</Mono>
                        </DataCell>
                        <DataCell $w="20%">{cred.label}</DataCell>
                        <DataCell $w="18%">
                          <Mono>{cred.secretFingerprint ?? '—'}</Mono>
                        </DataCell>
                        <DataCell $w="12%">
                          <StatusPill tone={cred.status === 'active' ? 'success' : cred.status === 'revoked' ? 'neutral' : ('warning' as StatusTone)} dot={false}>
                            {cred.status ?? 'unknown'}
                          </StatusPill>
                        </DataCell>
                        <DataCell $w="14%">{cred.rotatedAt ? cred.rotatedAt.slice(0, 10) : <Muted>never</Muted>}</DataCell>
                        <DataCell $w="20%" $align="right">
                          <RowActions>
                            <IconBtn
                              type="button"
                              aria-label={`Rotate ${cred.label}`}
                              title={canGovern ? 'Rotate (fresh MFA proof required)' : governDenied}
                              disabled={!canGovern || cred.status === 'revoked'}
                              onClick={() =>
                                navigate({ to: '/agent-studio/models/credentials/$credentialId/rotate', params: { credentialId: cred.id } })
                              }
                            >
                              <RefreshCw size={13} strokeWidth={1.7} />
                            </IconBtn>
                            <IconBtn
                              type="button"
                              aria-label={`Revoke ${cred.label}`}
                              title={canGovern ? 'Revoke immediately (no MFA wait)' : governDenied}
                              disabled={!canGovern || revokeCredential.isPending || cred.status === 'revoked'}
                              onClick={() => setRevokeTarget({ id: cred.id, label: cred.label })}
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
            )}

            <PolicyStrip>
              <PolicyStep>
                <PolicyIcon>
                  <Fingerprint size={16} strokeWidth={1.8} />
                </PolicyIcon>
                <div>
                  <PolicyTitle>Fingerprint-only</PolicyTitle>
                  <PolicyDesc>The list shows fingerprints; secrets stay vaulted.</PolicyDesc>
                </div>
              </PolicyStep>
              <PolicyStep>
                <PolicyIcon>
                  <ShieldCheck size={16} strokeWidth={1.8} />
                </PolicyIcon>
                <div>
                  <PolicyTitle>MFA on create & rotate</PolicyTitle>
                  <PolicyDesc>Revoke stays proof-free for incident response.</PolicyDesc>
                </div>
              </PolicyStep>
              <PolicyStep>
                <PolicyIcon>
                  <Info size={16} strokeWidth={1.8} />
                </PolicyIcon>
                <div>
                  <PolicyTitle>No connection test</PolicyTitle>
                  <PolicyDesc>Bad keys surface at run time — rotate to recover.</PolicyDesc>
                </div>
              </PolicyStep>
            </PolicyStrip>
          </Panel>
        </SectionGap>
      </motion.div>

      {/* M-3 revoke stays a ConfirmDialog — out of scope for the modal→section migration. */}
      <ConfirmDialog
        open={revokeTarget !== null}
        title="Revoke this credential?"
        message={`“${revokeTarget?.label ?? ''}” stops working immediately — models depending on it flip to provider_credential_missing. Revocation never waits on MFA so incident response stays fast.`}
        destructive
        confirmLabel="Revoke now"
        onConfirm={() => {
          if (revokeTarget) {
            revokeCredential.mutate(buildRevokeInput(revokeTarget.id, revokeReason, revokeCompromised));
          }
          closeRevoke();
        }}
        onCancel={closeRevoke}
      >
        <div style={{ marginTop: 12 }}>
          <TextInput
            label="Reason (optional)"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="e.g. key leaked in a log"
            maxLength={512}
            hint="≤512 characters — recorded on the credential row."
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={revokeCompromised}
            onChange={(e) => setRevokeCompromised(e.target.checked)}
          />
          Mark as compromised — pages owner/admin
        </label>
      </ConfirmDialog>
    </>
  );
}
