import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { KeyRound, ShieldCheck, Trash2, RefreshCw } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Switch } from '@components/common/ui/Switch';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
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
  useCreateProviderCredential,
  useRotateProviderCredential,
  useRevokeProviderCredential,
  useProviderEnablements,
  useSetProviderEnablement,
  MODEL_PROVIDERS,
} from '@hooks/studio/useSetupProviders';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
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

const TabRow = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
`;

const Tab = styled.button<{ $on: boolean }>`
  border: 1px solid ${({ $on, theme }) => ($on ? theme.app.status.lilac.border : theme.app.border.strong)};
  background: ${({ $on, theme }) => ($on ? theme.app.status.lilac.bg : 'transparent')};
  color: ${({ $on, theme }) => ($on ? theme.app.text.primary : theme.app.text.secondary)};
  border-radius: 8px;
  padding: 6px 12px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
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

export function ModelsView() {
  const { role } = useOrg();
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');
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
          <ViewTitle>Models</ViewTitle>
          <ViewSubtitle>
            Live catalog availability — usable rows are pickable in the editor; the rest name their reason. Drafts advise, publish enforces.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <TabRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Tab type="button" $on={tab === 'catalog'} onClick={() => setTab('catalog')}>
          Catalog{total > 0 ? ` (${usable}/${total} usable)` : ''}
        </Tab>
        <Tab type="button" $on={tab === 'providers'} onClick={() => setTab('providers')}>
          Providers
        </Tab>
      </TabRow>

      {tab === 'catalog' ? (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
          <Panel title="Model catalog" subtitle="Published allowlist ∩ org enablements ∩ credentials ∩ residency. Prices are list ($/1k tokens); unpriced never implies free.">
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
                                  {reason === 'provider_credential_missing' && ' — add BYOK in Providers.'}
                                  {reason === 'provider_not_enabled' && ' — enable the provider below.'}
                                  {reason === 'residency_incompatible' && ' — outside the org residency pin.'}
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
                Publish refuses models the org residency does not serve (<Mono>residency &apos;&lt;r&gt;&apos; not served by catalog models</Mono>).
                The pin itself is govern-plane configuration — this surface shows per-model residency tags so makers pick servable
                models; the refusal (when it triggers) renders verbatim with the uncovered models named.
              </Note>
            </Panel>
          </SectionGap>
        </motion.div>
      ) : (
        <ProvidersTab canWrite={canWrite} writeDenied={writeDenied} canGovern={canGovern} governDenied={governDenied} />
      )}
    </ViewShell>
  );
}

function ProvidersTab({ canWrite, writeDenied, canGovern, governDenied }: { canWrite: boolean; writeDenied: string; canGovern: boolean; governDenied: string }) {
  // Credential reads are owner/admin/developer — readers/billing get the
  // denied panel, never a 403 flash (the server enforces regardless).
  const credentials = useProviderCredentials({ enabled: canWrite });
  const enablements = useProviderEnablements();
  const setEnablement = useSetProviderEnablement();
  const createCredential = useCreateProviderCredential();
  const rotateCredential = useRotateProviderCredential();
  const revokeCredential = useRevokeProviderCredential();

  const [credOpen, setCredOpen] = useState(false);
  const [rotateTarget, setRotateTarget] = useState<{ id: string; label: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; label: string } | null>(null);

  const enabledByProvider = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const row of enablements.data ?? []) {
      map.set(row.provider, row.enabled);
    }
    return map;
  }, [enablements.data]);

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
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel
          title="Provider credentials (BYOK)"
          subtitle="Fingerprint-only list. Create/rotate demand a fresh MFA proof; revoke stays proof-free so incident response never waits."
          action={
            <ActionButton size="sm" disabled={!canGovern} title={canGovern ? 'Add a provider credential' : governDenied} onClick={() => setCredOpen(true)}>
              <KeyRound size={13} strokeWidth={1.8} />
              Add credential
            </ActionButton>
          }
        >
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
                          disabled={!canGovern || rotateCredential.isPending || cred.status === 'revoked'}
                          onClick={() => setRotateTarget({ id: cred.id, label: cred.label })}
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
          {/* A4-81: honest disclosure — there is no credential connection
              test. The engine never dials providers (the model gateway in
              Agent Studio owns all provider HTTP, and the credential row
              stores no endpoint), so a mistyped/revoked key surfaces at
              run time. Stating it beats a fake "Test" button. */}
          <Note style={{ marginTop: 12 }}>
            No connection test is available for these credentials yet — a mistyped or revoked key is discovered
            when a run calls the model. If a run fails on provider authentication, check the key at your
            provider, then rotate the credential here.
          </Note>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
        <SectionGap>
          <Panel title="Provider enablements" subtitle="Absent row = default on. Disabling flips dependent models to provider_not_enabled.">
            <QueryView query={enablements} skeleton={undefined} isEmpty={() => false} empty={{ title: '', description: '' }}>
              {() => (
                <DataTable>
                  <DataHead>
                    <DataCell $w="50%">Provider</DataCell>
                    <DataCell $w="50%">Enabled</DataCell>
                  </DataHead>
                  {MODEL_PROVIDERS.map((provider) => {
                    const enabled = enabledByProvider.get(provider) ?? true;
                    return (
                      <DataRow key={provider} $interactive={false}>
                        <DataCell $w="50%">
                          <Mono>{provider}</Mono>
                        </DataCell>
                        <DataCell $w="50%">
                          <span title={canGovern ? `Toggle ${provider}` : governDenied}>
                            <Switch
                              checked={enabled}
                              disabled={!canGovern || setEnablement.isPending}
                              aria-label={`Enable ${provider}`}
                              onChange={(next) => {
                                if (!next) {
                                  toast(`Disabling ${provider} flips its models to provider_not_enabled.`);
                                }
                                setEnablement.mutate({ provider, enabled: next });
                              }}
                            />
                          </span>
                        </DataCell>
                      </DataRow>
                    );
                  })}
                </DataTable>
              )}
            </QueryView>
          </Panel>
        </SectionGap>
      </motion.div>

      <CredentialModal
        open={credOpen}
        onClose={() => setCredOpen(false)}
        title="Add provider credential"
        submitLabel="Add (MFA proof required)"
        onSubmit={(input) => createCredential.mutate(input, { onSuccess: () => setCredOpen(false) })}
        pending={createCredential.isPending}
        withLabel
      />
      <CredentialModal
        open={rotateTarget !== null}
        onClose={() => setRotateTarget(null)}
        title={`Rotate — ${rotateTarget?.label ?? ''}`}
        submitLabel="Rotate (MFA proof required)"
        onSubmit={(input) => {
          if (rotateTarget) {
            rotateCredential.mutate({ credentialId: rotateTarget.id, secret: input.secret }, { onSuccess: () => setRotateTarget(null) });
          }
        }}
        pending={rotateCredential.isPending}
      />
      <ConfirmDialog
        open={revokeTarget !== null}
        title="Revoke this credential?"
        message={`“${revokeTarget?.label ?? ''}” stops working immediately — models depending on it flip to provider_credential_missing. Revocation never waits on MFA so incident response stays fast.`}
        destructive
        confirmLabel="Revoke now"
        onConfirm={() => {
          if (revokeTarget) {
            revokeCredential.mutate({ credentialId: revokeTarget.id });
          }
          setRevokeTarget(null);
        }}
        onCancel={() => setRevokeTarget(null)}
      />
    </>
  );
}

function CredentialModal({
  open,
  onClose,
  title,
  submitLabel,
  onSubmit,
  pending,
  withLabel = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  onSubmit: (input: { provider: string; label: string; secret: string }) => void;
  pending: boolean;
  withLabel?: boolean;
}) {
  const [provider, setProvider] = useState<string>(MODEL_PROVIDERS[1]);
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');

  const valid = provider.trim() !== '' && secret.trim() !== '' && (withLabel ? label.trim() !== '' : true);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={520}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={!valid || pending}
            onClick={() => {
              onSubmit({ provider: provider.trim(), label: withLabel ? label.trim() : provider.trim(), secret: secret.trim() });
              setSecret('');
            }}
          >
            <ShieldCheck size={13} strokeWidth={1.8} />
            {submitLabel}
          </ActionButton>
        </>
      }
    >
      <TextInput label="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="anthropic" hint={`One of: ${MODEL_PROVIDERS.join(', ')}`} />
      {withLabel && (
        <div style={{ marginTop: 12 }}>
          <TextInput label="Label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. prod-anthropic" />
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <TextInput
          label="Secret (write-only — sealed on arrival, cleared on submit)"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="…"
          autoComplete="off"
        />
      </div>
    </Modal>
  );
}
