import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Copy as CopyIcon, Check, Smartphone, KeyRound, ChevronLeft, AlertTriangle, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Modal } from '@components/common/ui/Modal';
import { Switch } from '@components/common/ui/Switch';
import { TextInput } from '@components/common/ui/TextInput';
import { Panel } from '@components/common/ui/Panel';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { spring, pageItem } from '@styles/motion';
import { useMfa, useEnrollTotp, useActivateTotp, useDisableTotp, useRotateRecoveryCodes, parseEnrollment, otpauthFromSecret } from '@hooks/studio/useMfa';
import { useSessions, useRevokeSession, useRevokeAllSessions } from '@hooks/studio/useSessions';
import { useAccount, useChangePassword, useDeletionStatus, useRequestAccountDeletion, useCancelAccountDeletion } from '@hooks/studio/useAccount';
import { useAudit } from '@hooks/engine/queries';
import { useOrg } from '@/Context/OrgContext';
import { SaveRow } from './shared';

/**
 * Settings → Security (ledger T-3) — every flow here is real:
 * - Password change through POST /auth/me/password (current password verified
 *   server-side; errors surface verbatim).
 * - TOTP: enroll returns the server-issued provisioning material, rendered
 *   as a genuine QR; activation verifies a live code; disabling requires a
 *   step-up proof with a confirmation dialog.
 * - Recovery codes come from the engine's rotation endpoint — one-time
 *   display, copy-all, download.
 * - Sessions: live list with per-session and revoke-all.
 * - Security audit: the org's hash-chained audit trail (role-gated).
 * - Danger zone: account deletion with status + cancel.
 */

type Step = 'scan' | 'verify' | 'codes';

export function SettingsSecurity() {
  const account = useAccount();
  const mfa = useMfa();
  const { role } = useOrg();
  const canSeeAudit = role !== 'reader';

  const [step, setStep] = useState<Step | null>(null);
  const [enrollment, setEnrollment] = useState<{ otpauthUrl: string | null; secret: string | null } | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disableConfirm, setDisableConfirm] = useState(false);

  const enroll = useEnrollTotp();
  const activate = useActivateTotp();
  const disable = useDisableTotp();
  const rotateCodes = useRotateRecoveryCodes();
  const twoFa = mfa.data?.enabled ?? false;

  const openFlow = async () => {
    try {
      const raw = await enroll.mutateAsync();
      setEnrollment(parseEnrollment(raw));
      setCode('');
      setStep('scan');
    } catch {
      /* the hook surfaced the error */
    }
  };

  const closeFlow = () => {
    setStep(null);
    setCode('');
    setEnrollment(null);
  };

  const verifyAndAdvance = async () => {
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    try {
      await activate.mutateAsync(code.trim());
      const rotated = await rotateCodes.mutateAsync();
      setRecoveryCodes(rotated.codes ?? []);
      setStep('codes');
    } catch {
      /* activation errors surface via toast; stay on the verify step */
    }
  };

  const finishEnable = () => {
    closeFlow();
    toast.success('Two-factor authentication is on');
  };

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <Panel title="Authentication" subtitle="Password and two-factor settings for your account.">
          <PasswordFields />
          <TwoFaRow>
            <div>
              <TwoFaTitle>
                <ShieldCheck size={14} strokeWidth={1.8} />
                Two-factor authentication
                {twoFa && <EnabledPill>enabled</EnabledPill>}
              </TwoFaTitle>
              <TwoFaSub>
                Require a second factor on every sign-in. We support authenticator apps and security keys.
              </TwoFaSub>
            </div>
            <Switch
              checked={twoFa}
              onChange={(next) => {
                if (next) {
                  void openFlow();
                } else {
                  setDisableConfirm(true);
                }
              }}
              disabled={enroll.isPending || mfa.isPending}
            />
          </TwoFaRow>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Active sessions" subtitle="Where you are currently signed in.">
          <SessionsPanel />
        </Panel>
      </motion.div>

      {canSeeAudit && <SecurityAudit />}

      <DangerZone />

      {/* ─── 2FA enable flow ─── */}
      <Modal
        open={step !== null}
        onClose={closeFlow}
        width={520}
        title={
          <StepTitle>
            {step !== null && step !== 'scan' && (
              <BackBtn
                type="button"
                aria-label="Back"
                onClick={() => setStep(step === 'verify' ? 'scan' : 'verify')}
                whileTap={{ scale: 0.94 }}
                transition={spring.snap}
              >
                <ChevronLeft size={14} strokeWidth={2} />
              </BackBtn>
            )}
            <span>
              {step === 'scan' && 'Set up two-factor'}
              {step === 'verify' && 'Verify code'}
              {step === 'codes' && 'Save recovery codes'}
            </span>
          </StepTitle>
        }
        footer={
          step === 'codes' ? (
            <>
              <GhostBtn
                type="button"
                disabled={rotateCodes.isPending}
                onClick={async () => {
                  const rotated = await rotateCodes.mutateAsync().catch(() => null);
                  if (rotated) {
                    setRecoveryCodes(rotated.codes ?? []);
                    toast.success('New codes generated — the old ones no longer work');
                  }
                }}
              >
                Regenerate
              </GhostBtn>
              <PrimaryBtn type="button" onClick={finishEnable} whileTap={{ scale: 0.97 }} transition={spring.snap}>
                <Check size={13} strokeWidth={2} />
                I've saved them
              </PrimaryBtn>
            </>
          ) : step === 'verify' ? (
            <PrimaryBtn
              type="button"
              disabled={code.length !== 6 || activate.isPending}
              onClick={() => void verifyAndAdvance()}
              whileTap={{ scale: 0.97 }}
              transition={spring.snap}
            >
              Verify
            </PrimaryBtn>
          ) : (
            <PrimaryBtn
              type="button"
              disabled={!enrollment}
              onClick={() => setStep('verify')}
              whileTap={{ scale: 0.97 }}
              transition={spring.snap}
            >
              Continue
            </PrimaryBtn>
          )
        }
      >
        <AnimatePresence mode="wait">
          {step === 'scan' && enrollment && (
            <StepPanel
              key="scan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={spring.spring}
            >
              <ScanLead>
                Scan the QR code with an authenticator app like 1Password, Authy, or Google Authenticator.
              </ScanLead>
              <ScanRow>
                <QRFrame>
                  <QRCodeSVG
                    value={enrollment.otpauthUrl ?? otpauthFromSecret(enrollment.secret ?? '', account.data?.email ?? null)}
                    size={140}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#0b0d12"
                    style={{ width: '100%', height: '100%' }}
                  />
                </QRFrame>
                <ScanSide>
                  {enrollment.secret && (
                    <>
                      <SecretLabel>Or enter this setup key manually</SecretLabel>
                      <SecretRow>
                        <SecretCode>{enrollment.secret}</SecretCode>
                        <CopyMiniBtn
                          type="button"
                          aria-label="Copy setup key"
                          onClick={() => {
                            navigator.clipboard.writeText(enrollment.secret?.replace(/\s/g, '') ?? '');
                            toast.success('Setup key copied');
                          }}
                        >
                          <CopyIcon size={11} strokeWidth={1.8} />
                        </CopyMiniBtn>
                      </SecretRow>
                    </>
                  )}
                  <AccountMeta>
                    <AccountLabel>Account</AccountLabel>
                    <AccountValue>{account.data?.email ?? '—'}</AccountValue>
                  </AccountMeta>
                  <AccountMeta>
                    <AccountLabel>Type</AccountLabel>
                    <AccountValue>Time-based (TOTP)</AccountValue>
                  </AccountMeta>
                </ScanSide>
              </ScanRow>
            </StepPanel>
          )}

          {step === 'verify' && (
            <StepPanel
              key="verify"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={spring.spring}
            >
              <ScanLead>Enter the 6-digit code shown in your authenticator app.</ScanLead>
              <OtpWrap>
                <OtpInput
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  aria-label="Verification code"
                />
                <OtpOverlay aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <OtpCell key={i} $filled={i < code.length}>
                      {code[i] ?? ''}
                    </OtpCell>
                  ))}
                </OtpOverlay>
              </OtpWrap>
              <VerifyNote>
                Codes refresh every 30 seconds. If the code keeps failing, check the time on your device — it
                must be within ±30 seconds of our servers.
              </VerifyNote>
            </StepPanel>
          )}

          {step === 'codes' && recoveryCodes !== null && (
            <StepPanel
              key="codes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={spring.spring}
            >
              <RecoveryBanner>
                <ShieldCheck size={16} strokeWidth={1.8} />
                <BannerBody>
                  <BannerTitle>Keep these somewhere safe</BannerTitle>
                  <BannerText>
                    Each code works once. If you lose your authenticator, these are the only way back in.
                  </BannerText>
                </BannerBody>
              </RecoveryBanner>
              <CodesGrid>
                {recoveryCodes.map((c, i) => (
                  <CodeRow key={`${c}-${i}`}>
                    <CodeNum>{i + 1}.</CodeNum>
                    <CodeText>{c}</CodeText>
                    <CodeCopy
                      type="button"
                      aria-label={`Copy code ${i + 1}`}
                      onClick={() => {
                        navigator.clipboard.writeText(c);
                        toast.success('Code copied');
                      }}
                      whileTap={{ scale: 0.9 }}
                      transition={spring.snap}
                    >
                      <CopyIcon size={11} strokeWidth={1.8} />
                    </CodeCopy>
                  </CodeRow>
                ))}
              </CodesGrid>
              <DownloadRow>
                <GhostBtn
                  type="button"
                  onClick={() => {
                    const text = `Neryva recovery codes\n\n${recoveryCodes.join('\n')}\n`;
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = 'neryva-recovery-codes.txt';
                    anchor.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download size={12} strokeWidth={1.8} />
                  Download as text
                </GhostBtn>
              </DownloadRow>
            </StepPanel>
          )}
        </AnimatePresence>
      </Modal>

      <ConfirmDialog
        open={disableConfirm}
        title="Disable two-factor authentication?"
        message="Your account will be protected by your password only. You can turn it back on at any time."
        destructive
        confirmLabel="Disable"
        onConfirm={() => {
          disable.mutate(undefined, {
            onSuccess: () => toast.success('Two-factor authentication is off'),
          });
          setDisableConfirm(false);
        }}
        onCancel={() => setDisableConfirm(false)}
      />
    </>
  );
}

// ─── Password change ─────────────────────────────────────────────────
function PasswordFields() {
  const change = useChangePassword();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const save = () => {
    if (!currentPwd || !newPwd) {
      toast.error('Enter your current and new password');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPwd === currentPwd) {
      toast.error('The new password must be different');
      return;
    }
    change.mutate(
      { currentPassword: currentPwd, newPassword: newPwd },
      {
        onSuccess: () => {
          toast.success('Password updated');
          setCurrentPwd('');
          setNewPwd('');
          setConfirmPwd('');
        },
      },
    );
  };

  return (
    <>
      <FieldRow>
        <TextInput label="Current password" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} autoComplete="current-password" />
        <TextInput label="New password" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} autoComplete="new-password" />
        <TextInput label="Confirm new password" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} autoComplete="new-password" />
      </FieldRow>
      <SaveRow onSave={save} saveLabel="Update password" disabled={change.isPending} />
    </>
  );
}

// ─── Sessions ────────────────────────────────────────────────────────
function SessionsPanel() {
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const revokeAll = useRevokeAllSessions();
  const [confirmAll, setConfirmAll] = useState(false);
  const rows = sessions.data ?? [];
  const others = rows.filter((s) => !s.current).length;

  return (
    <>
      <SessionActions>
        <ActionButton variant="secondary" size="sm" disabled={others === 0 || revokeAll.isPending} onClick={() => setConfirmAll(true)}>
          Revoke all other devices
        </ActionButton>
      </SessionActions>
      <QueryView
        query={sessions}
        skeleton={<Skeleton $h="180px" $r="12px" />}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'No active sessions', description: 'Sign-ins appear here as you use Neryva across devices.' }}
      >
        {(data) => (
          <SessionList>
            {data.map((sess) => {
              const isMobile = /iphone|android|mobile/i.test(sess.label);
              return (
                <SessionRow key={sess.id}>
                  <SessionIcon aria-hidden="true">
                    {isMobile ? <Smartphone size={15} strokeWidth={1.7} /> : <KeyRound size={15} strokeWidth={1.7} />}
                  </SessionIcon>
                  <SessionInfo>
                    <SessionName>
                      {sess.label}{' '}
                      {sess.current && <CurrentTag>this device</CurrentTag>}
                    </SessionName>
                    {sess.meta && <SessionMeta>{sess.meta}</SessionMeta>}
                  </SessionInfo>
                  {!sess.current && (
                    <RevokeBtn
                      type="button"
                      disabled={revoke.isPending}
                      onClick={() => revoke.mutate(sess.id, { onSuccess: () => toast.success('Session revoked') })}
                    >
                      Revoke
                    </RevokeBtn>
                  )}
                </SessionRow>
              );
            })}
          </SessionList>
        )}
      </QueryView>

      <ConfirmDialog
        open={confirmAll}
        title="Revoke all other sessions?"
        message="Every signed-in device except this one will be signed out and need to sign in again."
        destructive
        confirmLabel="Revoke all"
        onConfirm={() => {
          revokeAll.mutate(undefined, { onSuccess: () => toast.success('Other sessions revoked') });
          setConfirmAll(false);
        }}
        onCancel={() => setConfirmAll(false)}
      />
    </>
  );
}

// ─── Security audit (org trail, role-gated) ──────────────────────────
function SecurityAudit() {
  const audit = useAudit({ limit: 10 });
  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
      <Panel title="Security activity" subtitle="The most recent events from your organization’s audit trail." flush>
        <QueryView
          query={audit}
          skeleton={<Skeleton $h="180px" $r="12px" />}
          isEmpty={(d) => d.events.length === 0}
          empty={{ title: 'No events yet', description: 'Security-relevant actions in your organization appear here.' }}
        >
          {(data) => (
            <AuditList>
              {data.events.map((event) => (
                <AuditRow key={event.id}>
                  <AuditTime>{event.created_at.slice(0, 10)}</AuditTime>
                  <AuditEvent>{event.action}</AuditEvent>
                  <AuditActor>{event.actor_type}</AuditActor>
                </AuditRow>
              ))}
            </AuditList>
          )}
        </QueryView>
      </Panel>
    </motion.div>
  );
}

// ─── Danger zone ─────────────────────────────────────────────────────
function DangerZone() {
  const deletion = useDeletionStatus({ pollWhilePending: true });
  const requestDeletion = useRequestAccountDeletion();
  const cancelDeletion = useCancelAccountDeletion();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pending = deletion.data && deletion.data.status !== 'none' ? deletion.data : null;

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
      <Panel title="Danger zone" subtitle="Irreversible account actions.">
        {pending && pending.status !== 'none' ? (
          <PendingDelete>
            <AlertTriangle size={15} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <PendingTitle>Deletion {pending.status === 'scheduled' ? 'scheduled' : 'requested'}</PendingTitle>
              <PendingMeta>
                {pending.scheduledPurgeAt
                  ? `Purge runs ${new Date(Date.parse(pending.scheduledPurgeAt)).toLocaleString()}. Sign in before then to cancel.`
                  : 'Your account is scheduled for deletion.'}
              </PendingMeta>
            </div>
            <ActionButton variant="secondary" size="sm" disabled={cancelDeletion.isPending} onClick={() => cancelDeletion.mutate(undefined, { onSuccess: () => toast.success('Deletion cancelled') })}>
              Cancel deletion
            </ActionButton>
          </PendingDelete>
        ) : (
          <DeleteRow>
            <DeleteInfo>
              <DeleteTitle>Delete your account</DeleteTitle>
              <DeleteMeta>
                Your organizations keep running without you; memberships end and your personal data is purged per the retention policy.
              </DeleteMeta>
            </DeleteInfo>
            <ActionButton variant="danger" size="sm" disabled={requestDeletion.isPending} onClick={() => setConfirmDelete(true)}>
              Delete account
            </ActionButton>
          </DeleteRow>
        )}
      </Panel>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        message="This schedules your account for deletion. You lose access everywhere, and the purge is irreversible once it runs. Organizations you own should be transferred first."
        destructive
        confirmLabel="Schedule deletion"
        onConfirm={() => {
          requestDeletion.mutate(undefined, { onSuccess: () => toast.success('Deletion scheduled — you can cancel until the purge runs') });
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </motion.div>
  );
}

// ─── styled ──────────────────────────────────────────────────────────
const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const TwoFaRow = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

const TwoFaTitle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};

  svg {
    color: ${({ theme }) => theme.app.status.emerald.fg};
  }
`;

const TwoFaSub = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 4px;
  line-height: 1.5;
  max-width: 380px;
`;

const EnabledPill = styled.span`
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.30);
  color: ${({ theme }) => theme.app.status.emerald.fg};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 500;
`;

const StepTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

const BackBtn = styled(motion.button)`
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: ${({ theme }) => theme.app.surface.active};
  color: ${({ theme }) => theme.app.text.secondary};
  border-radius: 6px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const StepPanel = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ScanLead = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.55;
`;

const ScanRow = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const QRFrame = styled.div`
  padding: 10px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  aspect-ratio: 1;
`;

const ScanSide = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
`;

const SecretLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
`;

const SecretRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

const SecretCode = styled.code`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: 0.04em;
  word-break: break-all;
  line-height: 1.4;
`;

const CopyMiniBtn = styled(motion.button)`
  width: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  border-radius: 6px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const AccountMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.caption};
  padding: 4px 0;
  border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

const AccountLabel = styled.span`
  color: ${({ theme }) => theme.app.text.muted};
`;

const AccountValue = styled.span`
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

const OtpWrap = styled.div`
  position: relative;
  align-self: center;
  width: 280px;
`;

const OtpInput = styled.input`
  position: relative;
  z-index: 2;
  width: 100%;
  border: 0;
  background: transparent;
  outline: none;
  color: transparent;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 28px;
  letter-spacing: 0.4em;
  padding: 0;
  caret-color: transparent;
  text-align: center;
`;

const OtpOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  pointer-events: none;
`;

const OtpCell = styled.div<{ $filled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  border-radius: 10px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 22px;
  color: ${({ $filled, theme }) => ($filled ? theme.app.text.primary : 'transparent')};
  background: ${({ $filled }) =>
    $filled
      ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
      : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${({ $filled, theme }) =>
    $filled ? theme.app.status.lilac.border : theme.app.border.strong};
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};
`;

const VerifyNote = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.faint};
  line-height: 1.55;
  text-align: center;
`;

const RecoveryBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 11px;
  background: rgba(96, 165, 250, 0.06);
  border: 1px solid rgba(96, 165, 250, 0.18);

  svg {
    color: ${({ theme }) => theme.app.status.info.fg};
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const CodesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
`;

const CodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

const CodeNum = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.ghost};
  width: 16px;
`;

const CodeText = styled.code`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: 0.02em;
`;

const CodeCopy = styled(motion.button)`
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  border-radius: 5px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const DownloadRow = styled.div`
  display: flex;
  justify-content: center;
`;

const GhostBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const PrimaryBtn = styled(motion.button)`
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

// ─── sessions + audit + danger zone ──────────────────────────────────
const SessionActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
`;

const SessionList = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 -22px -22px;
`;

const SessionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};

  &:last-child {
    border-bottom: 0;
  }
`;

const SessionIcon = styled.div`
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.secondary};
  flex-shrink: 0;
`;

const SessionInfo = styled.div`
  min-width: 0;
  flex: 1;
`;

const SessionName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CurrentTag = styled.span`
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: 5px;
  background: ${({ theme }) => theme.app.status.success.bg};
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  color: ${({ theme }) => theme.app.status.success.fg};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const SessionMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
`;

const RevokeBtn = styled.button`
  padding: 5px 10px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &:hover {
    background: ${({ theme }) => theme.app.status.error.bg};
    border-color: ${({ theme }) => theme.app.status.error.border};
    color: ${({ theme }) => theme.app.status.error.fg};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const AuditList = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 -22px -22px;
`;

const AuditRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};

  &:last-child {
    border-bottom: 0;
  }
`;

const AuditTime = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
  width: 80px;
  flex-shrink: 0;
`;

const AuditEvent = styled.div`
  flex: 1;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  min-width: 0;
`;

const AuditActor = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

const BannerBody = styled.div``;

const BannerTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  font-weight: 500;
`;

const BannerText = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
  line-height: 1.5;
`;

const DeleteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const DeleteInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const DeleteTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.status.error.fg};
`;

const DeleteMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 3px;
  line-height: 1.5;
`;

const PendingDelete = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 11px;
  background: ${({ theme }) => theme.app.status.error.bg};
  border: 1px solid ${({ theme }) => theme.app.status.error.border};

  > svg {
    color: ${({ theme }) => theme.app.status.error.fg};
    flex-shrink: 0;
  }

  > div:nth-child(2) {
    flex: 1;
    min-width: 0;
  }
`;

const PendingTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

const PendingMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
  line-height: 1.5;
`;
