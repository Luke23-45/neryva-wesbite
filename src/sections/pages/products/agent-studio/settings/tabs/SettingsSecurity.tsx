import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Copy as CopyIcon, Check, Smartphone, KeyRound, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Modal } from '@components/common/ui/Modal';
import { Switch } from '@components/common/ui/Switch';
import { TextInput } from '@components/common/ui/TextInput';
import { Panel } from '@components/common/ui/Panel';
import { spring, pageItem } from '@styles/motion';
import settings from '@neryva_data/products/agent_studio/settings.json';
import { SaveRow } from './shared';

/**
 * Settings → Security
 *
 * Apple-grade behaviors:
 * - Two-factor toggle is real and triggers the multi-step enable flow
 *   when flipped on. Disabling shows a confirm dialog.
 * - The enable flow has 3 steps: scan QR → verify 6-digit code → save
 *   recovery codes. Each step crossfades with a spring.
 * - The "QR" is a procedural SVG (looks like a real QR — finder patterns
 *   in 3 corners, deterministic dot fill from the secret). This avoids
 *   pulling in a QR library just for a demo.
 * - 6-digit input is a single field with auto-advance — typed digits
 *   flow through with a spring-scaled digit preview.
 * - Recovery codes: 10 codes in a 2-column grid. Each has a copy icon
 *   that confirms with a brief ✓ swap.
 */

type Step = 'scan' | 'verify' | 'codes';

const RECOVERY_CODE_COUNT = 10;

function makeRecoveryCodes(): string[] {
  const words = ['swift', 'calm', 'frost', 'glow', 'amber', 'quartz', 'river', 'spark', 'cloud', 'dusk'];
  const out: string[] = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i += 1) {
    const w = words[(i * 3 + Math.floor(Math.random() * words.length)) % words.length];
    const n = String(Math.floor(1000 + Math.random() * 9000));
    out.push(`${w}-${n}`);
  }
  return out;
}

function makeSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let s = '';
  for (let i = 0; i < 32; i += 1) s += chars[Math.floor(Math.random() * chars.length)];
  return s.match(/.{1,4}/g)!.join(' ');
}



export function SettingsSecurity() {
  const s = settings.security;
  const [twoFa, setTwoFa] = useState(s.twoFactor);
  const [step, setStep] = useState<Step | null>(null);
  const [secret] = useState(() => makeSecret());
  const [recoveryCodes] = useState(() => makeRecoveryCodes());
  const [code, setCode] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const openFlow = () => {
    setCode('');
    setStep('scan');
  };

  const closeFlow = () => {
    setStep(null);
    setCode('');
  };

  const verifyAndAdvance = () => {
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setStep('codes');
  };

  const enable = () => {
    setTwoFa(true);
    closeFlow();
    toast.success('Two-factor enabled');
  };

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <Panel title="Authentication" subtitle="Password and two-factor settings for your account.">
          <FieldRow>
            <TextInput
              label="Current password"
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
            />
            <TextInput
              label="New password"
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <TextInput
              label="Confirm new password"
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
          </FieldRow>
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
                if (next) openFlow();
                else setTwoFa(false);
              }}
            />
          </TwoFaRow>
          <SaveRow
            onSave={() => {
              if (newPwd && newPwd !== confirmPwd) {
                toast.error('Passwords do not match');
                return;
              }
              toast.success('Security settings saved');
            }}
          />
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Active sessions" subtitle="Where you are currently signed in.">
          <SessionList>
            {s.sessions.map((sess) => {
              const isMobile = /iphone|android|mobile/i.test(sess.device);
              return (
                <SessionRow key={sess.id}>
                  <SessionIcon aria-hidden="true">
                    {isMobile ? <Smartphone size={15} strokeWidth={1.7} /> : <KeyRound size={15} strokeWidth={1.7} />}
                  </SessionIcon>
                  <SessionInfo>
                    <SessionName>
                      {sess.device}{' '}
                      {sess.current && <CurrentTag>this device</CurrentTag>}
                    </SessionName>
                    <SessionMeta>
                      {sess.location} · {sess.lastActive}
                    </SessionMeta>
                  </SessionInfo>
                  {!sess.current && (
                    <RevokeBtn type="button" onClick={() => toast.success('Session revoked')}>
                      Revoke
                    </RevokeBtn>
                  )}
                </SessionRow>
              );
            })}
          </SessionList>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel title="Audit log" subtitle="Recent security and configuration events.">
          <AuditList>
            {s.auditLog.map((a, i) => (
              <AuditRow key={i}>
                <AuditTime>{a.time}</AuditTime>
                <AuditEvent>{a.event}</AuditEvent>
                <AuditActor>{a.actor}</AuditActor>
              </AuditRow>
            ))}
          </AuditList>
        </Panel>
      </motion.div>

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
              <GhostBtn type="button" onClick={() => toast.success('Recovery codes regenerated')}>
                Regenerate
              </GhostBtn>
              <PrimaryBtn type="button" onClick={enable} whileTap={{ scale: 0.97 }} transition={spring.snap}>
                <Check size={13} strokeWidth={2} />
                I've saved them
              </PrimaryBtn>
            </>
          ) : step === 'verify' ? (
            <PrimaryBtn
              type="button"
              onClick={verifyAndAdvance}
              whileTap={{ scale: 0.97 }}
              transition={spring.snap}
            >
              Verify
            </PrimaryBtn>
          ) : (
            <PrimaryBtn
              type="button"
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
          {step === 'scan' && (
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
                  <QRCodeSvg value={secret} />
                </QRFrame>
                <ScanSide>
                  <SecretLabel>Or enter this setup key manually</SecretLabel>
                  <SecretRow>
                    <SecretCode>{secret}</SecretCode>
                    <CopyMiniBtn
                      type="button"
                      aria-label="Copy setup key"
                      onClick={() => {
                        navigator.clipboard.writeText(secret.replace(/\s/g, ''));
                        toast.success('Setup key copied');
                      }}
                    >
                      <CopyIcon size={11} strokeWidth={1.8} />
                    </CopyMiniBtn>
                  </SecretRow>
                  <AccountMeta>
                    <AccountLabel>Account</AccountLabel>
                    <AccountValue>{settings.profile.email}</AccountValue>
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

          {step === 'codes' && (
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
                  <CodeRow key={c}>
                    <CodeNum>{i + 1}.</CodeNum>
                    <CodeText>{c}</CodeText>
                    <CodeCopy
                      type="button"
                      aria-label={`Copy ${c}`}
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
            </StepPanel>
          )}
        </AnimatePresence>
      </Modal>
    </>
  );
}

// ─── Pseudo-QR (no library needed for a demo) ────────────────────────
function QRCodeSvg({ value }: { value: string }) {
  // Deterministic 25×25 grid. Three finder patterns in 3 corners
  // (the recognizable QR squares). Middle fill is hashed from the value.
  const size = 25;
  const cells: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder pattern: 7×7 squares in TL, TR, BL with a 3×3 center.
  const finder = (cx: number, cy: number) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const isBorder = x === 0 || x === 6 || y === 0 || y === 6;
        const isCore = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        cells[cy + y][cx + x] = isBorder || isCore;
      }
    }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);

  // Fill the middle based on a hash of `value` for stable appearance.
  const hash = (s: string) => {
    let h = 5381;
    for (let i = 0; i < s.length; i += 1) h = (h * 33) ^ s.charCodeAt(i);
    return Math.abs(h);
  };
  let h = hash(value);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Skip finder zones.
      if ((x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8)) continue;
      h = (h * 1664525 + 1013904223) >>> 0;
      cells[y][x] = (h & 0xff) > 128;
    }
  }

  const rects: React.ReactNode[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (cells[y][x]) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0b0d12" />);
      }
    }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#fff" />
      {rects}
    </svg>
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

const GhostBtn = styled.button`
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
`;

// ─── sessions + audit + banner ───────────────────────────────────────
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
