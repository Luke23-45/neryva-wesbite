import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ShieldCheck, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { CopyButton } from '@components/common/ui/CopyButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { spring, ease } from '@styles/motion';
import styled from 'styled-components';
import settings from '@neryva_data/products/agent_studio/settings.json';

/**
 * Settings → API keys
 *
 * Apple-grade behaviors:
 * - Multi-step create modal. Each step has its own subtle fade+rise entry
 *   so the eye knows it has progressed. The progress dots at the top
 *   fill with a spring animation as you advance.
 * - Scope toggles are real iOS-style switches grouped by category.
 * - Expiry is a segmented control with a sliding selection pill
 *   (same pattern as the UpgradeModal billing toggle).
 * - The "reveal" step shows the secret in a tinted green box — matches
 *   GitHub/Stripe's "this is shown once" pattern, with copy + done CTA.
 * - Revoke uses the standard ConfirmDialog (destructive styling).
 * - Newly created keys are inserted into the local list so the table
 *   updates without a refresh (the new row slides in with a layout
 *   animation).
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

const premiumEase = ease.standard;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: premiumEase, delay: i * 0.04 } }),
};

export function SettingsApiKeys() {
  const initialKeys = settings.apiKeys;
  const [keys, setKeys] = useState(initialKeys);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('details');

  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<Record<ScopeKey, boolean>>({
    'agents:read': true,
    'agents:write': false,
    'conversations:read': true,
    'conversations:write': false,
    'analytics:read': true,
    'billing:read': false,
  });
  const [expiry, setExpiry] = useState<Expiry>('90d');
  const [generated, setGenerated] = useState<string | null>(null);

  const [revokeTarget, setRevokeTarget] = useState<null | { id: string; name: string; prefix: string; created: string; lastUsed: string }>(null);

  const openCreate = () => {
    setName('');
    setStep('details');
    setGenerated(null);
    setScopes({
      'agents:read': true,
      'agents:write': false,
      'conversations:read': true,
      'conversations:write': false,
      'analytics:read': true,
      'billing:read': false,
    });
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

  const goNext = () => {
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
      // Generate.
      const secret = `nv_live_${randomString(20)}.${randomString(32)}`;
      setGenerated(secret);
      const today = new Date().toISOString().slice(0, 10);
      const prefix = `nv_live_${secret.slice(8, 14)}…`;
      setKeys((k) => [
        {
          id: `key-${Date.now()}`,
          name,
          prefix,
          created: today,
          lastUsed: '—',
        },
        ...k,
      ]);
      setStep('reveal');
    }
  };

  const goBack = () => {
    if (step === 'scopes') setStep('details');
    else if (step === 'expiry') setStep('scopes');
    else if (step === 'reveal') setStep('expiry');
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
      <Panel
        title="API keys"
        subtitle="Programmatic access to your workspace. Keep these secret."
        action={
          <PrimaryButton type="button" onClick={openCreate} whileTap={{ scale: 0.97 }} transition={spring.snap}>
            <Plus size={13} strokeWidth={2} />
            New key
          </PrimaryButton>
        }
      >
        <TableWrap>
          <TableHeader>
            <div style={{ width: '30%' }}>Name</div>
            <div style={{ width: '28%' }}>Key</div>
            <div style={{ width: '18%' }}>Created</div>
            <div style={{ width: '18%' }}>Last used</div>
            <div style={{ width: '60px' }} />
          </TableHeader>
          {keys.map((k, i) => (
            <TableRow
              key={k.id}
              as={motion.div}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.spring, delay: i * 0.03 }}
            >
              <div style={{ width: '30%', fontSize: 13.5, color: '#f5f7fb', fontWeight: 500 }}>{k.name}</div>
              <div style={{ width: '28%', display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyPill>{k.prefix}</KeyPill>
                <CopyButton value={k.prefix} label="Copy" />
              </div>
              <div style={{ width: '18%', fontSize: 12.5, color: 'rgba(229,231,235,0.65)', fontVariantNumeric: 'tabular-nums' }}>{k.created}</div>
              <div style={{ width: '18%', fontSize: 12.5, color: 'rgba(229,231,235,0.65)' }}>{k.lastUsed}</div>
              <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
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
            </TableRow>
          ))}
          {keys.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'rgba(229,231,235,0.5)' }}>
              No API keys yet — create one to get started.
            </div>
          )}
        </TableWrap>
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
              <PrimaryButton type="button" onClick={goNext} whileTap={{ scale: 0.97 }} transition={spring.snap}>
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
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#f5f7fb' }}>Key created</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(229,231,235,0.65)', marginTop: 2 }}>
                    "{name}" is ready. Copy it now — this is the only time the full secret will be shown.
                  </div>
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
            toast.error(`"${revokeTarget.name}" revoked`);
            setKeys((ks) => ks.filter((x) => x.id !== revokeTarget.id));
          }
          setRevokeTarget(null);
        }}
        onCancel={() => setRevokeTarget(null)}
      />
    </motion.div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────
function randomString(len: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i += 1) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
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
  color: rgba(248, 113, 113, 0.7);
  border-radius: 7px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(248, 113, 113, 0.10);
    color: rgba(248, 113, 113, 1);
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
  color: ${({ $active, $reached }) => ($active ? '#fff' : $reached ? '#f5f7fb' : 'rgba(229, 231, 235, 0.5)')};
  background: ${({ $active, $reached }) =>
    $active
      ? '${({ theme }) => theme.colors.gradients.primary}'
      : $reached
        ? 'rgba(192, 132, 252, 0.20)'
        : 'rgba(255, 255, 255, 0.04)'};
  border: 1px solid ${({ $active, $reached }) => ($active || $reached ? 'transparent' : 'rgba(255, 255, 255, 0.08)')};
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
  border: 1px solid ${({ $on }) => ($on ? 'transparent' : 'rgba(255, 255, 255, 0.10)')};
  background: ${({ $on }) =>
    $on
      ? '${({ theme }) => theme.colors.gradients.primary}'
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
  border: 1.5px solid ${({ $on }) => ($on ? 'transparent' : 'rgba(255, 255, 255, 0.18)')};
  background: ${({ $on }) =>
    $on
      ? '${({ theme }) => theme.colors.gradients.primary}'
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
