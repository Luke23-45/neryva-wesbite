import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ShieldCheck, Check, RefreshCw, FolderInput, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { CopyButton } from '@components/common/ui/CopyButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { EmptyState } from '@components/common/ui/EmptyState';
import { ApiError } from '@lib/engine/client';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import { spring, pageItem } from '@styles/motion';
import styled from 'styled-components';
import { useKeys, useProjects, type KeyRow } from '@hooks/engine/queries';
import { useIssueKey, useRevokeKey } from '@hooks/engine/mutations';
import { useKeyDetail, useRotateKey, useUpdateKey, useBindKey, useUnbindKey, expiresAtFromChoice } from '@hooks/studio/useStudioKeys';
import { useOrg } from '@/Context/OrgContext';

/**
 * Settings → API keys (ledger T-4) — fully engine-backed:
 * - Issue: the 4-step wizard submits to the engine (step-up protected,
 *   auto-retried on expired proofs); the reveal step shows the real
 *   server-minted secret exactly once.
 * - Rotate: re-mints server-side with the same reveal-once contract.
 * - Rename/rescope (PATCH), revoke, per-key detail (binding, usage
 *   counters), and project binding via the studio-furniture plane.
 * - Scopes are submitted as chosen; the engine validates and any
 *   validation error surfaces verbatim.
 */

type Step = 'details' | 'scopes' | 'expiry' | 'reveal';
type ScopeKey = (typeof SCOPES)[number]['items'][number]['key'];
type Expiry = '30d' | '90d' | '1y' | 'never';

const SCOPES = [
  {
    group: 'Agents',
    items: [
      { key: 'agents:read', label: 'Read agents', desc: 'List agents, fetch configs' },
      { key: 'agents:write', label: 'Write agents', desc: 'Create, update, delete agents' },
    ],
  },
  {
    group: 'Conversations',
    items: [
      { key: 'conversations:read', label: 'Read conversations', desc: 'List and fetch transcripts' },
      { key: 'conversations:write', label: 'Send messages', desc: 'Send messages on behalf of an agent' },
    ],
  },
  {
    group: 'Workspace',
    items: [
      { key: 'analytics:read', label: 'Read analytics', desc: 'Usage metrics, performance' },
      { key: 'billing:read', label: 'Read billing', desc: 'Invoices, plan, usage' },
    ],
  },
] as const;

const EXPIRY_OPTIONS: { id: Expiry; label: string; hint?: string }[] = [
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days', hint: 'Recommended' },
  { id: '1y', label: '1 year' },
  { id: 'never', label: 'Never' },
];

const STEPS: { id: Step; label: string }[] = [
  { id: 'details', label: 'Name' },
  { id: 'scopes', label: 'Scopes' },
  { id: 'expiry', label: 'Expiry' },
  { id: 'reveal', label: 'Reveal' },
];

const DEFAULT_SCOPES: Record<ScopeKey, boolean> = {
  'agents:read': true,
  'agents:write': false,
  'conversations:read': true,
  'conversations:write': false,
  'analytics:read': true,
  'billing:read': false,
};

export function SettingsApiKeys() {
  const { atLeast } = useOrg();
  const canManage = atLeast('developer');
  const keys = useKeys();
  const revoke = useRevokeKey();

  // J1-04 (twin of /platform/api-keys): a 404 on the keys read means the
  // engine's keys module is disabled in this deployment — not a failure.
  // The honest state is "unavailable", and key creation is withheld since
  // issuing would 404 too.
  const keysDisabled =
    keys.isError && keys.error instanceof ApiError && keys.error.status === 404;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('details');

  const [name, setName] = useState('');
  const [role, setRole] = useState<'operator' | 'auditor'>('operator');
  const [scopes, setScopes] = useState<Record<ScopeKey, boolean>>(DEFAULT_SCOPES);
  const [expiry, setExpiry] = useState<Expiry>('90d');
  const [generated, setGenerated] = useState<string | null>(null);
  const issue = useIssueKey();

  const [revokeTarget, setRevokeTarget] = useState<KeyRow | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rotateTarget, setRotateTarget] = useState<KeyRow | null>(null);
  const rotate = useRotateKey();
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);

  const openCreate = () => {
    setName('');
    setRole('operator');
    setStep('details');
    setGenerated(null);
    setScopes(DEFAULT_SCOPES);
    setExpiry('90d');
    setOpen(true);
  };

  const closeCreate = () => {
    setOpen(false);
    setTimeout(() => {
      setStep('details');
      setGenerated(null);
      setName('');
    }, 250);
  };

  const goNext = async () => {
    if (step === 'details') {
      if (!name.trim()) {
        toast.error('Give the key a name to identify it later');
        return;
      }
      setStep('scopes');
    } else if (step === 'scopes') {
      const any = Object.values(scopes).some(Boolean);
      if (!any) {
        toast.error('Pick at least one scope');
        return;
      }
      setStep('expiry');
    } else if (step === 'expiry') {
      // The engine mints the key — step-up is handled by the mutation
      // (auto-retry with a fresh proof on step_up_required).
      try {
        const created = await issue.mutateAsync({
          name: name.trim(),
          role,
          scopes: Object.entries(scopes).filter(([, on]) => on).map(([key]) => key),
          expires_at: expiresAtFromChoice(expiry),
        });
        setGenerated(created.key);
        setStep('reveal');
      } catch {
        /* the hook surfaced the error; stay on the step */
      }
    }
  };

  const goBack = () => {
    if (step === 'scopes') setStep('details');
    else if (step === 'expiry') setStep('scopes');
    else if (step === 'reveal') setStep('expiry');
  };

  const startRotate = () => {
    if (!rotateTarget) return;
    rotate.mutate(
      { keyId: rotateTarget.id },
      {
        onSuccess: (result) => {
          setRotatedSecret(result.key ?? result.secret ?? null);
        },
      },
    );
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
      <Panel
        title="API keys"
        subtitle="Programmatic access to your workspace. Keep these secret."
        action={
          canManage && !keysDisabled ? (
            <PrimaryButton type="button" onClick={openCreate} whileTap={{ scale: 0.97 }} transition={spring.snap}>
              <Plus size={13} strokeWidth={2} />
              New key
            </PrimaryButton>
          ) : undefined
        }
      >
        {keysDisabled ? (
          <EmptyState
            icon={<KeyRound size={18} opacity={0.5} />}
            title="API keys are not available in this deployment"
            description="The engine's API keys module is disabled, so keys cannot be listed or issued. Enable the keys module on the engine to use API keys."
          />
        ) : (
        <QueryView query={keys} skeleton={<Skeleton $h="220px" $r="12px" />} isEmpty={(d) => d.keys.length === 0} empty={{ title: 'No API keys yet', description: canManage ? 'Create one to get started — the secret is shown exactly once.' : 'Ask an owner, admin, or developer to create one.' }}>
          {(data) => (
            <TableWrap>
              <TableHeader>
                <div style={{ width: '30%' }}>Name</div>
                <div style={{ width: '28%' }}>Key</div>
                <div style={{ width: '18%' }}>Created</div>
                <div style={{ width: '18%' }}>Last used</div>
                <div style={{ width: canManage ? '60px' : '0' }} />
              </TableHeader>
              {data.keys.map((k, i) => (
                <TableRow
                  key={k.id}
                  as={motion.div}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.spring, delay: i * 0.03 }}
                >
                  <KeyCellName>
                    <NameButton type="button" onClick={() => setDetailId(k.id)} title="Key details">
                      {k.name}
                    </NameButton>
                    <NameMeta>
                      {k.revoked ? <StatusPill tone="neutral" dot={false}>revoked</StatusPill> : k.expiresAt ? <span>expires {k.expiresAt.slice(0, 10)}</span> : <span>no expiry</span>}
                    </NameMeta>
                  </KeyCellName>
                  <div style={{ width: '28%', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <KeyPill>{k.prefix}</KeyPill>
                    <CopyButton value={k.prefix} label="Copy" />
                  </div>
                  <KeyCellMeta>{k.createdAt.slice(0, 10)}</KeyCellMeta>
                  <KeyCellMeta>{k.lastUsedAt ? k.lastUsedAt.slice(0, 10) : '—'}</KeyCellMeta>
                  {canManage && (
                    <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                      <IconBtn
                        type="button"
                        onClick={() => { setRotateTarget(k); setRotatedSecret(null); }}
                        aria-label={`Rotate ${k.name}`}
                        whileTap={{ scale: 0.9 }}
                        transition={spring.snap}
                      >
                        <RefreshCw size={13} strokeWidth={1.7} />
                      </IconBtn>
                      <IconBtn
                        type="button"
                        onClick={() => setRevokeTarget(k)}
                        aria-label={`Revoke ${k.name}`}
                        whileTap={{ scale: 0.9 }}
                        transition={spring.snap}
                      >
                        <Trash2 size={13} strokeWidth={1.7} />
                      </IconBtn>
                    </div>
                  )}
                </TableRow>
              ))}
            </TableWrap>
          )}
        </QueryView>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={closeCreate}
        title="Create API key"
        width={520}
        footer={
          step === 'reveal' ? (
            <PrimaryButton type="button" onClick={closeCreate} whileTap={{ scale: 0.97 }} transition={spring.snap}>
              <Check size={13} strokeWidth={2} />
              Done
            </PrimaryButton>
          ) : (
            <>
              {step !== 'details' ? (
                <GhostButton type="button" onClick={goBack}>
                  Back
                </GhostButton>
              ) : (
                <GhostButton type="button" onClick={closeCreate}>
                  Cancel
                </GhostButton>
              )}
              <PrimaryButton type="button" onClick={() => void goNext()} disabled={issue.isPending} whileTap={{ scale: 0.97 }} transition={spring.snap}>
                {step === 'expiry' ? 'Generate key' : 'Continue'}
              </PrimaryButton>
            </>
          )
        }
      >
        <Stepper>
          {STEPS.map((s, i) => {
            const reachedIdx = STEPS.findIndex((x) => x.id === step);
            const reached = i <= reachedIdx;
            return (
              <Step key={s.id} $active={s.id === step} $reached={reached}>
                <Dot
                  $active={s.id === step}
                  $reached={reached}
                  initial={false}
                  animate={{ scale: s.id === step ? 1.05 : 1 }}
                  transition={spring.snap}
                >
                  {reached && s.id !== step ? <Check size={9} strokeWidth={2.4} /> : i + 1}
                </Dot>
                <StepLabel>{s.label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>

        <StepBody key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring.snap}>
          {step === 'details' && (
            <FieldStack>
              <TextInput
                label="Key name"
                placeholder="e.g. Production backend"
                value={name}
                onChange={(e) => setName(e.target.value)}
                hint="Helps you identify this key later — it isn't shared."
                autoFocus
              />
              <SelectField label="Key role">
                <RolePicker value={role} onChange={(e) => setRole(e.target.value as 'operator' | 'auditor')} aria-label="Key role">
                  <option value="operator">Operator — read and act</option>
                  <option value="auditor">Auditor — read-only, audit scoped</option>
                </RolePicker>
              </SelectField>
              <Helper>
                <ShieldCheck size={13} strokeWidth={1.8} />
                Treat every API key like a password. Don't commit keys to source control.
              </Helper>
            </FieldStack>
          )}

          {step === 'scopes' && (
            <FieldStack>
              <ScopeSummary>
                {Object.entries(scopes).filter(([, v]) => v).length === 0
                  ? 'No scopes selected'
                  : `${Object.entries(scopes).filter(([, v]) => v).length} of ${Object.keys(scopes).length} scopes selected`}
              </ScopeSummary>
              <ScopeGroups>
                {SCOPES.map((group) => (
                  <ScopeGroup key={group.group}>
                    <ScopeGroupTitle>{group.group}</ScopeGroupTitle>
                    {group.items.map((s) => (
                      <ScopeRow key={s.key} as={motion.label} whileTap={{ scale: 0.99 }} transition={spring.snap}>
                        <div style={{ minWidth: 0 }}>
                          <ScopeLabel>{s.label}</ScopeLabel>
                          <ScopeDesc>{s.desc}</ScopeDesc>
                          <ScopeCode>{s.key}</ScopeCode>
                        </div>
                        <Toggle
                          type="button"
                          role="switch"
                          aria-checked={scopes[s.key]}
                          $on={scopes[s.key]}
                          onClick={() => setScopes((m) => ({ ...m, [s.key]: !m[s.key] }))}
                        >
                          <ToggleThumb layout transition={spring.bouncy} $on={scopes[s.key]} />
                        </Toggle>
                      </ScopeRow>
                    ))}
                  </ScopeGroup>
                ))}
              </ScopeGroups>
            </FieldStack>
          )}

          {step === 'expiry' && (
            <FieldStack>
              <ExpiryLabel>When should this key expire?</ExpiryLabel>
              <ExpiryGrid>
                {EXPIRY_OPTIONS.map((opt) => (
                  <ExpiryCard
                    key={opt.id}
                    type="button"
                    $on={expiry === opt.id}
                    onClick={() => setExpiry(opt.id)}
                    whileTap={{ scale: 0.985 }}
                    transition={spring.snap}
                  >
                    <Radio $on={expiry === opt.id}>
                      {expiry === opt.id && (
                        <motion.span
                          layoutId="expiry-radio"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={spring.bouncy}
                          style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: '#fff' }}
                        />
                      )}
                    </Radio>
                    <ExpiryName>{opt.label}</ExpiryName>
                    {opt.hint && <ExpiryHint>{opt.hint}</ExpiryHint>}
                  </ExpiryCard>
                ))}
              </ExpiryGrid>
            </FieldStack>
          )}

          {step === 'reveal' && generated && (
            <RevealWrap>
              <RevealSuccess>
                <ShieldCheck size={20} strokeWidth={1.7} />
                <div>
                  <CreatedTitle>Key created</CreatedTitle>
                  <CreatedText>
                    "{name}" is ready. Copy it now — this is the only time the full secret will be shown.
                  </CreatedText>
                </div>
              </RevealSuccess>
              <RevealBox>
                <RevealSecret>{generated}</RevealSecret>
                <CopyButton value={generated} label="Copy key" />
              </RevealBox>
              <RevealNote>
                We've stored the prefix <code>{generated.slice(0, 14)}…</code> in your workspace. The full secret is only shown once.
              </RevealNote>
            </RevealWrap>
          )}
        </StepBody>
      </Modal>

      {/* ─── Rotate: server re-mints; reveal-once ─── */}
      <Modal
        open={!!rotateTarget}
        onClose={() => setRotateTarget(null)}
        title={rotatedSecret ? 'New key secret' : `Rotate "${rotateTarget?.name ?? ''}"?`}
        width={520}
        footer={
          rotatedSecret ? (
            <PrimaryButton type="button" onClick={() => { setRotateTarget(null); setRotatedSecret(null); }} whileTap={{ scale: 0.97 }} transition={spring.snap}>
              <Check size={13} strokeWidth={2} />
              Done
            </PrimaryButton>
          ) : (
            <>
              <GhostButton type="button" onClick={() => setRotateTarget(null)}>Cancel</GhostButton>
              <PrimaryButton type="button" disabled={rotate.isPending} onClick={startRotate} whileTap={{ scale: 0.97 }} transition={spring.snap}>
                <RefreshCw size={13} strokeWidth={2} />
                Rotate now
              </PrimaryButton>
            </>
          )
        }
      >
        {rotatedSecret ? (
          <RevealWrap>
            <RevealSuccess>
              <ShieldCheck size={20} strokeWidth={1.7} />
              <div>
                <CreatedTitle>Key rotated</CreatedTitle>
                <CreatedText>The old secret stopped working the moment the new one was issued.</CreatedText>
              </div>
            </RevealSuccess>
            <RevealBox>
              <RevealSecret>{rotatedSecret}</RevealSecret>
              <CopyButton value={rotatedSecret} label="Copy key" />
            </RevealBox>
            <RevealNote>This is the only time the new secret is shown.</RevealNote>
          </RevealWrap>
        ) : (
          <RotateNote>
            <ShieldCheck size={13} strokeWidth={1.8} />
            Rotation issues a new secret for "{rotateTarget?.name}" and invalidates the old one immediately. Services using the old key must be updated.
          </RotateNote>
        )}
      </Modal>

      {/* ─── Key detail drawer: binding, counters ─── */}
      {detailId && <KeyDrawer keyId={detailId} onClose={() => setDetailId(null)} />}

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoke API key?"
        message={
          revokeTarget
            ? `"${revokeTarget.name}" will stop working immediately. Any service using it will need to be updated with a new key.`
            : ''
        }
        destructive
        confirmLabel="Revoke"
        onConfirm={() => {
          if (revokeTarget) {
            revoke.mutate(
              { keyId: revokeTarget.id },
              { onSuccess: () => toast.success(`"${revokeTarget.name}" revoked`) },
            );
          }
          setRevokeTarget(null);
        }}
        onCancel={() => setRevokeTarget(null)}
      />
    </motion.div>
  );
}

// ─── Key detail drawer ───────────────────────────────────────────────
function KeyDrawer({ keyId, onClose }: { keyId: string; onClose: () => void }) {
  const detail = useKeyDetail(keyId);
  const projects = useProjects();
  const keys = useKeys();
  const update = useUpdateKey();
  const bind = useBindKey();
  const unbind = useUnbindKey();
  const [rename, setRename] = useState<string | null>(null);

  const info = detail.data;
  // createdAt fallback: the detail endpoint only recently started returning
  // it (keys.service K-3); the list row has always carried it.
  const listCreatedAt = keys.data?.keys.find((k) => k.id === keyId)?.createdAt ?? null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Key details"
      width={520}
      footer={
        <PrimaryButton type="button" onClick={onClose} whileTap={{ scale: 0.97 }} transition={spring.snap}>
          Close
        </PrimaryButton>
      }
    >
      {!info ? (
        <Skeleton $h="200px" $r="12px" />
      ) : (
        <DetailStack>
          <DetailGrid>
            <DetailLabel>Name</DetailLabel>
            <DetailValue>
              {rename === null ? (
                <NameButton type="button" onClick={() => setRename(info.name ?? '')} title="Rename">{info.name ?? '—'}</NameButton>
              ) : (
                <RenameRow>
                  <div style={{ flex: 1 }}>
                    <TextInput value={rename} onChange={(e) => setRename(e.target.value)} aria-label="Key name" autoFocus />
                  </div>
                  <ActionButton
                    variant="primary"
                    size="sm"
                    disabled={!rename.trim() || update.isPending}
                    onClick={() => update.mutate({ keyId: info.id, name: rename.trim() }, { onSuccess: () => { setRename(null); toast.success('Key renamed'); } })}
                  >
                    Save
                  </ActionButton>
                  <ActionButton variant="secondary" size="sm" onClick={() => setRename(null)}>Cancel</ActionButton>
                </RenameRow>
              )}
            </DetailValue>
            <DetailLabel>Prefix</DetailLabel>
            <DetailValue><KeyPill>{info.prefix ?? '—'}</KeyPill></DetailValue>
            <DetailLabel>Role</DetailLabel>
            <DetailValue>{info.role ?? '—'}</DetailValue>
            <DetailLabel>Scopes</DetailLabel>
            <DetailValue>{info.scopes.length > 0 ? info.scopes.join(', ') : '—'}</DetailValue>
            <DetailLabel>Created</DetailLabel>
            <DetailValue>{info.createdAt?.slice(0, 10) ?? listCreatedAt?.slice(0, 10) ?? '—'}</DetailValue>
            <DetailLabel>Expires</DetailLabel>
            <DetailValue>
              {info.expiresAt ? info.expiresAt.slice(0, 10) : 'no expiry'}
              {info.daysToExpiry !== null && info.daysToExpiry >= 0 ? ` (${info.daysToExpiry}d left)` : ''}
            </DetailValue>
            <DetailLabel>Last used</DetailLabel>
            <DetailValue>{info.lastUsedAt ? info.lastUsedAt.slice(0, 10) : 'never'}</DetailValue>
            <DetailLabel>Requests</DetailLabel>
            <DetailValue>{info.usageCount !== null ? info.usageCount.toLocaleString() : '—'}</DetailValue>
          </DetailGrid>

          <BindingBox>
            <DetailLabel>Project binding</DetailLabel>
            <BindingRow>
              <div style={{ flex: 1 }}>
                <RolePicker
                  value={info.projectId ?? ''}
                  onChange={(e) => {
                    const projectId = e.target.value;
                    if (projectId) {
                      bind.mutate({ keyId: info.id, projectId }, { onSuccess: () => toast.success('Key bound to project') });
                    } else {
                      unbind.mutate({ keyId: info.id }, { onSuccess: () => toast.success('Key unbound') });
                    }
                  }}
                  aria-label="Bound project"
                >
                  <option value="">Not bound — works across projects</option>
                  {(projects.data?.projects ?? []).filter((p) => !p.archivedAt).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </RolePicker>
              </div>
              <BindingHint aria-hidden="true"><FolderInput size={13} strokeWidth={1.8} /></BindingHint>
            </BindingRow>
            <BindingNote>Binding records which project a key belongs to for attribution. It is not an access boundary — the engine does not restrict a bound key's calls to its project.</BindingNote>
          </BindingBox>

          <BindingBox>
            <DetailLabel>Recent activity</DetailLabel>
            {info.events.length === 0 ? (
              <BindingNote>No recorded key events yet.</BindingNote>
            ) : (
              <ActivityList>
                {info.events.slice(0, 5).map((e, i) => (
                  <ActivityRow key={`${e.action}-${e.createdAt}-${i}`}>
                    <ActivityAction>{e.action ?? '—'}</ActivityAction>
                    <ActivityDate>{e.createdAt?.slice(0, 10) ?? '—'}</ActivityDate>
                  </ActivityRow>
                ))}
              </ActivityList>
            )}
          </BindingBox>
        </DetailStack>
      )}
    </Modal>
  );
}

// ─── styled ──────────────────────────────────────────────────────────
const PrimaryButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: ${({ theme }) => theme.colors.gradients.primary};
  color: #fff;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 9px;
  cursor: pointer;
  box-shadow: 0 4px 14px ${({ theme }) => theme.app.status.azure.border};

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const GhostButton = styled.button`
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 9px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    border-color: ${({ theme }) => theme.app.border.hover};
  }
`;

const TableWrap = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 -22px -22px;
`;

const TableHeader = styled.div`
  display: flex;
  padding: 10px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

const TableRow = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 12px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: ${({ theme }) => theme.app.surface.subtle};
  }
`;

const KeyPill = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  padding: 4px 8px;
  border-radius: 6px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

const IconBtn = styled(motion.button)`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  border-radius: 7px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const NameButton = styled.button`
  border: 0;
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  cursor: pointer;
  text-align: left;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

const NameMeta = styled.div`
  margin-top: 2px;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.ghost};
  display: flex;
  align-items: center;
  gap: 6px;
`;

function SelectField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <SelectFieldBox>
      <SelectLabel>{label}</SelectLabel>
      {children}
    </SelectFieldBox>
  );
}

const SelectFieldBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SelectLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const RolePicker = styled.select`
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 9px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }

  option {
    background: #14151c;
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

// ─── Stepper ─────────────────────────────────────────────────────────
const Stepper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 18px;
`;

const Step = styled.div<{ $active: boolean; $reached: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;

  &:not(:last-child)::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ $reached }) => ($reached ? 'rgba(192, 132, 252, 0.50)' : 'rgba(255, 255, 255, 0.08)')};
    margin: 0 6px;
    transition: background ${({ theme }) => theme.transitions.standard};
  }
`;

const Dot = styled(motion.div)<{ $active: boolean; $reached: boolean }>`
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${({ $active, $reached, theme }) => ($active ? '#fff' : $reached ? theme.app.text.primary : theme.app.text.faint)};
  background: ${({ $active, $reached, theme }) =>
    $active
      ? theme.colors.gradients.primary
      : $reached
        ? 'rgba(192, 132, 252, 0.20)'
        : 'rgba(255, 255, 255, 0.04)'};
  border: 1px solid ${({ $active, $reached, theme }) => ($active || $reached ? 'transparent' : theme.app.border.strong)};
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transitions.standard},
    color ${({ theme }) => theme.transitions.standard};
`;

const StepLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StepBody = styled(motion.div)`
  min-height: 180px;
`;

const FieldStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Helper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 9px;
  background: rgba(96, 165, 250, 0.06);
  border: 1px solid rgba(96, 165, 250, 0.18);
  color: rgba(147, 197, 253, 0.85);
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.5;

  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

const ScopeSummary = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  letter-spacing: 0.01em;
`;

const ScopeGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ScopeGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ScopeGroupTitle = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  padding: 0 4px;
`;

const ScopeRow = styled(motion.label)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.tint};
    border-color: ${({ theme }) => theme.app.border.strong};
  }
`;

const ScopeLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

const ScopeDesc = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 1px;
`;

const ScopeCode = styled.code`
  display: inline-block;
  margin-top: 4px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: rgba(147, 197, 253, 0.85);
`;

const Toggle = styled(motion.button)<{ $on: boolean }>`
  position: relative;
  width: 36px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid ${({ $on, theme }) => ($on ? 'transparent' : theme.app.border.strong)};
  background: ${({ $on, theme }) =>
    $on
      ? theme.colors.gradients.primary
      : 'rgba(255, 255, 255, 0.10)'};
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transitions.standard},
    border-color ${({ theme }) => theme.transitions.standard};

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.32);
  }
`;

const ToggleThumb = styled(motion.span)<{ $on: boolean }>`
  position: absolute;
  top: 50%;
  left: ${({ $on }) => ($on ? '18px' : '2px')};
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.30);
`;

const ExpiryLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-bottom: 6px;
`;

const ExpiryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

const ExpiryCard = styled(motion.button)<{ $on: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 11px;
  border: 1px solid
    ${({ $on }) => ($on ? 'rgba(96, 165, 250, 0.50)' : 'rgba(255, 255, 255, 0.06)')};
  background: ${({ $on }) =>
    $on
      ? 'linear-gradient(180deg, rgba(96, 165, 250, 0.10), rgba(37, 99, 235, 0.04))'
      : 'rgba(255, 255, 255, 0.02)'};
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};
`;

const Radio = styled.span<{ $on: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid ${({ $on, theme }) => ($on ? 'transparent' : theme.app.border.hover)};
  background: ${({ $on, theme }) =>
    $on
      ? theme.colors.gradients.primary
      : 'transparent'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;
`;

const ExpiryName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  flex: 1;
`;

const ExpiryHint = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(5, 227, 164, 0.12);
  color: ${({ theme }) => theme.app.status.emerald.fg};
  letter-spacing: 0.02em;
`;

const RevealWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RevealSuccess = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 11px;
  background: rgba(5, 227, 164, 0.06);
  border: 1px solid rgba(5, 227, 164, 0.25);

  svg {
    color: ${({ theme }) => theme.app.status.emerald.fg};
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const RevealBox = styled.div`
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid ${({ theme }) => theme.app.border.strong};
`;

const RevealSecret = styled.code`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.primary};
  background: transparent;
  border: 0;
  padding: 4px 6px;
  word-break: break-all;
  line-height: 1.5;
`;

const RevealNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;

  code {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    color: ${({ theme }) => theme.app.text.secondary};
  }
`;

const RotateNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 9px;
  background: rgba(96, 165, 250, 0.06);
  border: 1px solid rgba(96, 165, 250, 0.18);
  color: rgba(147, 197, 253, 0.85);
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.5;

  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

// ─── key list cells + detail drawer ──────────────────────────────────
const KeyCellName = styled.div`
  width: 30%;
  min-width: 0;
`;

const KeyCellMeta = styled.div`
  width: 18%;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;

const DetailStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 10px 14px;
  align-items: center;
`;

const DetailLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

const DetailValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  min-width: 0;
  word-break: break-word;
`;

const RenameRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
`;

const BindingBox = styled.div`
  padding: 12px 14px;
  border-radius: 11px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BindingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BindingHint = styled.span`
  color: ${({ theme }) => theme.app.text.muted};
  display: inline-flex;
`;

const BindingNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ActivityRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
`;

const ActivityAction = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.secondary};
  font-family: ui-monospace, monospace;
`;

const ActivityDate = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
`;

const CreatedTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

const CreatedText = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
`;
