import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Check, ShieldCheck, FolderInput } from 'lucide-react';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { CopyButton } from '@components/common/ui/CopyButton';
import { ActionButton } from '@components/common/ui/ActionButton';
import { spring, pageItem } from '@styles/motion';
import { useIssueKey } from '@hooks/engine/mutations';
import { expiresAtFromChoice } from '@hooks/studio/useStudioKeys';
import { useDefaultProject } from '@hooks/studio/useDefaultProject';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { Dropdown } from '@components/common/ui/Dropdown';

/**
 * Create API key — dedicated section replacing the create wizard modal (G-1).
 * The 4 steps (details → scopes → expiry → reveal) are byte-identical to the
 * modal version: same fields, same validation, same copy.
 *
 * Shown-once: the minted secret lives in memory only; the reveal marker
 * `settings:api-keys:create:revealed:<keyId>` is written the moment the
 * secret renders, plus a session pointer `settings:api-keys:create:latest`.
 * A refresh after reveal lands on an explicit "already revealed" state with
 * a safe recovery path (start a NEW key) — the old secret is never
 * re-displayed. The secret never touches the URL, logs, or storage.
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

// Marker per issued key (durable record) + a session pointer to the latest
// in-flight key (drives the already-revealed state after refresh).
const revealedKey = (keyId: string) => `settings:api-keys:create:revealed:${keyId}`;
const LATEST_KEY = 'settings:api-keys:create:latest';

function readLatestRevealed(): string | null {
  try {
    return sessionStorage.getItem(LATEST_KEY);
  } catch {
    return null;
  }
}

export function ApiKeyCreateSection() {
  const { role: orgRole } = useOrg();
  const navigate = useNavigate();
  // Same write-role check as the list tab: the engine's key WRITE roles are
  // exactly owner/admin/developer — billing may list keys but cannot issue.
  const canManage = orgRole === 'owner' || orgRole === 'admin' || orgRole === 'developer';

  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'operator' | 'auditor'>('operator');
  const [scopes, setScopes] = useState<Record<ScopeKey, boolean>>(DEFAULT_SCOPES);
  const [expiry, setExpiry] = useState<Expiry>('90d');
  const [generated, setGenerated] = useState<string | null>(null);
  // A refresh after reveal must never re-display the secret: if the session
  // pointer survived but the in-memory secret is gone, say so explicitly.
  // Initializer only — the marker can only pre-exist at mount (this component
  // writes it alongside `generated`, which takes precedence below).
  const [alreadyRevealed, setAlreadyRevealed] = useState(() => !!readLatestRevealed());
  const issue = useIssueKey();
  const defaultProject = useDefaultProject();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Non-write roles land here directly — bounce to the keys list (the
  // engine gates too); the form never renders before the gate.
  useEffect(() => {
    if (!canManage) {
      navigate({ to: '/agent-studio/settings/api-keys' });
    }
  }, [canManage, navigate]);

  // Dirty guard: block navigation while the wizard has unsent content
  // (the reveal step and the already-revealed state are terminal — no guard).
  const scopesDirty = (Object.keys(DEFAULT_SCOPES) as ScopeKey[]).some((k) => scopes[k] !== DEFAULT_SCOPES[k]);
  const dirty = !alreadyRevealed && step !== 'reveal' && (name.trim() !== '' || role !== 'operator' || scopesDirty || expiry !== '90d');
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unfinished API key. Leaving now discards it.');

  if (!canManage) {
    return null;
  }

  if (alreadyRevealed) {
    return (
      <ViewShell>
        <SectionBackRow to="/agent-studio/settings/api-keys">
          <span aria-hidden="true">‹</span> API keys
        </SectionBackRow>
        <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
          <ViewHeader>
            <ViewTitle ref={headingRef} tabIndex={-1}>Create API key</ViewTitle>
          </ViewHeader>
        </ViewHeaderRow>
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
          <Panel title="Already revealed" subtitle="This secret is gone — it was shown once and dismissed.">
            <RevealNotice>
              The secret for the key issued in this session was already shown and dismissed. It is never
              rendered twice — re-entering this page cannot bring it back.
            </RevealNotice>
            <ActionsRow>
              <ActionButton onClick={() => { try { sessionStorage.removeItem(LATEST_KEY); } catch { /* storage blocked */ } setAlreadyRevealed(false); }}>
                <Plus size={13} strokeWidth={2} />
                Create a new key
              </ActionButton>
            </ActionsRow>
          </Panel>
        </motion.div>
      </ViewShell>
    );
  }

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
      // (auto-retry with a fresh proof on step_up_required). P1-8: the
      // workspace default project binds the key at issue time (engine K-2);
      // a stale default resolves to null and is simply not sent.
      try {
        const created = await issue.mutateAsync({
          name: name.trim(),
          role,
          scopes: Object.entries(scopes).filter(([, on]) => on).map(([key]) => key),
          expires_at: expiresAtFromChoice(expiry),
          ...(defaultProject.project ? { project_id: defaultProject.project.id } : {}),
        });
        // Shown-once: mark the key revealed the moment the secret renders.
        // The pointer drives the already-revealed state after a refresh;
        // the secret itself lives in memory only — never in storage.
        try {
          sessionStorage.setItem(revealedKey(created.id), '1');
          sessionStorage.setItem(LATEST_KEY, created.id);
        } catch {
          // Storage blocked — the in-memory secret still renders once.
        }
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
  };

  const done = () => {
    try {
      sessionStorage.removeItem(LATEST_KEY);
    } catch {
      /* storage blocked */
    }
    navigate({ to: '/agent-studio/settings/api-keys' });
  };

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/settings/api-keys">
        <span aria-hidden="true">‹</span> API keys
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Create API key</ViewTitle>
          <ViewSubtitle>
            Programmatic access to your workspace. The secret is shown exactly once — copy it before you leave.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="New key" subtitle="Four steps — the secret is minted in the last one.">
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
                  <Dropdown
                    variant="select"
                    value={role}
                    onChange={(v) => setRole(v as 'operator' | 'auditor')}
                    aria-label="Key role"
                    items={[
                      { value: 'operator', label: 'Operator — read and act' },
                      { value: 'auditor', label: 'Auditor — read-only, audit scoped' },
                    ]}
                  />
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
                {defaultProject.project && (
                  <Helper>
                    <FolderInput size={13} strokeWidth={1.8} />
                    Bound to project “{defaultProject.project.name}” — your workspace default (Settings → Workspace).
                  </Helper>
                )}
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

          <ActionsRow>
            {step === 'reveal' ? (
              <PrimaryButton type="button" onClick={done} whileTap={{ scale: 0.97 }} transition={spring.snap}>
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
                  <GhostButton type="button" onClick={() => navigate({ to: '/agent-studio/settings/api-keys' })}>
                    Cancel
                  </GhostButton>
                )}
                <PrimaryButton type="button" onClick={() => void goNext()} disabled={issue.isPending} whileTap={{ scale: 0.97 }} transition={spring.snap}>
                  {step === 'expiry' ? 'Generate key' : 'Continue'}
                </PrimaryButton>
              </>
            )}
          </ActionsRow>
        </Panel>
      </motion.div>
      {dirtyDialog}
    </ViewShell>
  );
}

function SelectField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <SelectFieldBox>
      <SelectLabel>{label}</SelectLabel>
      {children}
    </SelectFieldBox>
  );
}

// ─── styled ──────────────────────────────────────────────────────────
const PrimaryButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: #3b82f6;
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

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const RevealNotice = styled.div`
  padding: 12px 14px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.5;
`;

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
  background: ${({ $active, $reached }) =>
    $active
      ? '#3b82f6'
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
  background: ${({ $on }) =>
    $on
      ? '#3b82f6'
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
      ? 'rgba(96, 165, 250, 0.08)'
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
  background: ${({ $on }) =>
    $on
      ? '#3b82f6'
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
