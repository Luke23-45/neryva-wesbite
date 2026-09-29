import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useNavigate } from '@tanstack/react-router';
import { ShieldCheck, Copy as CopyIcon, Check, ChevronLeft, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { spring, pageItem } from '@styles/motion';
import { useMfa, useEnrollTotp, useActivateTotp, useRotateRecoveryCodes, parseEnrollment, otpauthFromSecret } from '@hooks/studio/useMfa';
import { useAccount } from '@hooks/studio/useAccount';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';

/**
 * Two-factor setup — dedicated section replacing the 2FA enable-flow modal
 * (G-6). Stepped: "Set up two-factor" (QR SVG + manual key + Copy) →
 * "Verify code" (6-digit input) → "Save recovery codes" (list + Copy /
 * download + Regenerate + "I've saved them"). All copy byte-identical to the
 * modal version.
 *
 * Shown-once: the engine returns the recovery codes exactly once, on
 * activate — they live in memory only and the reveal marker
 * `settings:security:2fa:recovery:revealed` is written the moment they
 * render. A refresh after reveal lands on an explicit "already revealed"
 * state with a regenerate path (the server re-issues fresh codes; the old
 * ones are never re-displayed). The codes never touch the URL, logs, or
 * storage.
 *
 * This flow is per-account, not org-scoped — like the security tab, it has
 * no role gate. A deep link with 2FA already enabled shows an honest
 * "already on" state instead of re-enrolling.
 */

type Step = 'scan' | 'verify' | 'codes';

const REVEAL_MARKER = 'settings:security:2fa:recovery:revealed';

const TITLES: Record<Step, string> = {
  scan: 'Set up two-factor',
  verify: 'Verify code',
  codes: 'Save recovery codes',
};

function readRevealed(): boolean {
  try {
    return sessionStorage.getItem(REVEAL_MARKER) === '1';
  } catch {
    return false;
  }
}

function writeRevealed() {
  try {
    sessionStorage.setItem(REVEAL_MARKER, '1');
  } catch {
    // Storage blocked — the in-memory codes still render once.
  }
}

export function TwoFactorSetupSection() {
  const navigate = useNavigate();
  const account = useAccount();
  const mfa = useMfa();

  const [step, setStep] = useState<Step | null>(null);
  const [enrollment, setEnrollment] = useState<{ otpauthUrl: string | null; secret: string | null } | null>(null);
  const [enrollFailed, setEnrollFailed] = useState(false);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [alreadyRevealed, setAlreadyRevealed] = useState(() => readRevealed());
  // G-8 regenerate dialog (moved verbatim with the codes step — standalone
  // regenerate is out of scope, this keeps the in-flow recovery path).
  const [rotateDialog, setRotateDialog] = useState(false);
  const [rotateCode, setRotateCode] = useState('');

  const enroll = useEnrollTotp();
  const activate = useActivateTotp();
  const rotateCodes = useRotateRecoveryCodes();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const enrollStarted = useRef(false);

  const alreadyOn = mfa.data?.enabled === true;

  // Enrollment used to run when the Switch flipped on; the section starts
  // it on mount. Skipped when the codes were already revealed (re-enrolling
  // would disturb the live TOTP) or when 2FA is already on.
  useEffect(() => {
    if (enrollStarted.current || readRevealed() || mfa.isPending || mfa.isError) {
      return;
    }
    if (mfa.data?.enabled) {
      return;
    }
    enrollStarted.current = true;
    void enroll
      .mutateAsync()
      .then((raw) => {
        setEnrollment(parseEnrollment(raw));
        setEnrollFailed(false);
        setStep('scan');
      })
      .catch(() => {
        // the hook surfaced the error; offer a retry
        enrollStarted.current = false;
        setEnrollFailed(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mfa.isPending, mfa.isError, mfa.data?.enabled]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Dirty guard: block navigation while the flow has unsent setup state
  // (the codes step and the already-revealed state are terminal — no guard).
  const dirty = !alreadyRevealed && step !== null && step !== 'codes';
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have unfinished two-factor setup. Leaving now discards it.');

  const back = () => navigate({ to: '/agent-studio/settings/security' });

  const verifyAndAdvance = async () => {
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    try {
      // The engine returns the recovery codes exactly once, on activate —
      // display those instead of rotating (rotation is a separate,
      // user-initiated action that also needs a live code).
      const activated = await activate.mutateAsync(code.trim());
      setRecoveryCodes(activated.codes);
      writeRevealed();
      setCode('');
      setStep('codes');
    } catch {
      /* activation errors surface via toast; stay on the verify step */
    }
  };

  const runRotate = async () => {
    if (rotateCode.trim().length === 0) {
      toast.error('Enter a code from your authenticator');
      return;
    }
    try {
      const rotated = await rotateCodes.mutateAsync({ code: rotateCode.trim() });
      setRecoveryCodes(rotated.codes);
      writeRevealed();
      // Re-issuing means there ARE new codes to show: leave the
      // already-revealed branch and render the codes step. The marker stays
      // written, so a later refresh returns to the already-revealed state.
      setAlreadyRevealed(false);
      setStep('codes');
      setRotateDialog(false);
      toast.success('New codes generated — the old ones no longer work');
    } catch {
      /* rotation errors surface via toast; stay in the dialog */
    } finally {
      setRotateCode('');
    }
  };

  const finishEnable = () => {
    setCode('');
    setEnrollment(null);
    // Shown-once means shown-once: the codes must not linger in memory
    // after the flow completes.
    setRecoveryCodes(null);
    toast.success('Two-factor authentication is on');
    navigate({ to: '/agent-studio/settings/security' });
  };

  const downloadCodes = () => {
    if (!recoveryCodes) {
      return;
    }
    const text = `Neryva recovery codes\n\n${recoveryCodes.join('\n')}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'neryva-recovery-codes.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const regenerate = () => {
    setRotateCode('');
    setRotateDialog(true);
  };

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/settings/security">
        <span aria-hidden="true">‹</span> Security
      </SectionBackRow>

      {alreadyRevealed ? (
        <>
          <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
            <ViewHeader>
              <ViewTitle ref={headingRef} tabIndex={-1}>Recovery codes</ViewTitle>
            </ViewHeader>
          </ViewHeaderRow>
          <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
            <Panel title="Already revealed" subtitle="These codes are gone — they were shown once and dismissed.">
              <RevealNotice>
                The recovery codes issued in this session were already shown and dismissed. They are never
                rendered twice — refreshing cannot bring them back.
              </RevealNotice>
              <ActionsRow>
                <ActionButton variant="secondary" onClick={back}>
                  Back to security
                </ActionButton>
                <ActionButton onClick={regenerate} disabled={rotateCodes.isPending}>
                  Generate new codes
                </ActionButton>
              </ActionsRow>
            </Panel>
          </motion.div>
        </>
      ) : alreadyOn ? (
        <>
          <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
            <ViewHeader>
              <ViewTitle ref={headingRef} tabIndex={-1}>Set up two-factor</ViewTitle>
            </ViewHeader>
          </ViewHeaderRow>
          <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
            <Panel title="Already on" subtitle="Two-factor authentication is already enabled for your account.">
              <RevealNotice>
                Your account already has two-factor authentication enabled. If you lost your recovery codes,
                disable two-factor on the security tab and set it up again to receive a fresh set.
              </RevealNotice>
              <ActionsRow>
                <ActionButton variant="secondary" onClick={back}>
                  Back to security
                </ActionButton>
              </ActionsRow>
            </Panel>
          </motion.div>
        </>
      ) : (
        <>
          <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
            <ViewHeader>
              <StepTitleBar>
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
                <ViewTitle ref={headingRef} tabIndex={-1}>{step ? TITLES[step] : 'Set up two-factor'}</ViewTitle>
              </StepTitleBar>
            </ViewHeader>
          </ViewHeaderRow>

          <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
            <Panel
              title={step ? TITLES[step] : 'Setting up'}
              subtitle={
                step === 'codes'
                  ? 'Store these before you finish — there is no second chance.'
                  : 'Pair an authenticator app, then verify a live code.'
              }
            >
              {step === null ? (
                enrollFailed ? (
                  <>
                    <RevealNotice>
                      Two-factor setup could not start. The engine returned an error — nothing was changed.
                    </RevealNotice>
                    <ActionsRow>
                      <ActionButton variant="secondary" onClick={back}>
                        Back to security
                      </ActionButton>
                      <ActionButton
                        onClick={() => {
                          setEnrollFailed(false);
                          enrollStarted.current = true;
                          void enroll
                            .mutateAsync()
                            .then((raw) => {
                              setEnrollment(parseEnrollment(raw));
                              setStep('scan');
                            })
                            .catch(() => {
                              enrollStarted.current = false;
                              setEnrollFailed(true);
                            });
                        }}
                        disabled={enroll.isPending}
                      >
                        Try again
                      </ActionButton>
                    </ActionsRow>
                  </>
                ) : (
                  <RevealNotice>Starting two-factor setup…</RevealNotice>
                )
              ) : (
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
                        <GhostBtn type="button" onClick={downloadCodes}>
                          <Download size={12} strokeWidth={1.8} />
                          Download as text
                        </GhostBtn>
                      </DownloadRow>
                    </StepPanel>
                  )}
                </AnimatePresence>
              )}

              {step !== null && (
                <ActionsRow>
                  {step === 'codes' ? (
                    <>
                      <GhostBtn
                        type="button"
                        disabled={rotateCodes.isPending}
                        onClick={regenerate}
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
                  )}
                </ActionsRow>
              )}
            </Panel>
          </motion.div>
        </>
      )}

      {/* ─── G-8: regenerate recovery codes (in-flow) ─── */}
      <Modal
        open={rotateDialog}
        onClose={() => {
          setRotateDialog(false);
          setRotateCode('');
        }}
        width={440}
        title="Generate new recovery codes?"
        footer={
          <>
            <GhostBtn
              type="button"
              onClick={() => {
                setRotateDialog(false);
                setRotateCode('');
              }}
            >
              Cancel
            </GhostBtn>
            <PrimaryBtn
              type="button"
              disabled={rotateCode.trim().length === 0 || rotateCodes.isPending}
              onClick={() => void runRotate()}
              whileTap={{ scale: 0.97 }}
              transition={spring.snap}
            >
              Generate new codes
            </PrimaryBtn>
          </>
        }
      >
        <DialogCopy>
          Enter a code from your authenticator app to confirm. The codes shown above stop working
          the moment new ones are generated.
        </DialogCopy>
        <TextInput
          label="Authenticator code"
          value={rotateCode}
          onChange={(e) => setRotateCode(e.target.value)}
          autoComplete="one-time-code"
          inputMode="numeric"
          autoFocus
        />
      </Modal>
      {dirtyDialog}
    </ViewShell>
  );
}

// ─── styled ──────────────────────────────────────────────────────────
const StepTitleBar = styled.span`
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
  background: rgba(255, 255, 255, 0.03);
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

const BannerBody = styled.div``;

const BannerTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

const BannerText = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
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

const DialogCopy = styled.p`
  margin: 0 0 14px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.55;

  strong {
    color: ${({ theme }) => theme.app.text.primary};
    font-weight: 600;
  }
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
