import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Smartphone, KeyRound, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { useNavigate } from '@tanstack/react-router';
import { Modal } from '@components/common/ui/Modal';
import { Switch } from '@components/common/ui/Switch';
import { TextInput } from '@components/common/ui/TextInput';
import { Panel } from '@components/common/ui/Panel';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { DangerButton } from '@components/common/ui/ConfirmDialog/ConfirmDialog.styles';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import { useMfa, useDisableTotp } from '@hooks/studio/useMfa';
import { useSessions, useRevokeSession, useRevokeAllSessions } from '@hooks/studio/useSessions';
import { useChangePassword, useDeletionStatus, useRequestAccountDeletion, useCancelAccountDeletion } from '@hooks/studio/useAccount';
import { useAudit } from '@hooks/engine/queries';
import { useOrg } from '@/Context/OrgContext';
import { SaveRow } from './shared';

/**
 * Settings → Security (ledger T-3) — every flow here is real:
 * - Password change through POST /auth/me/password (current password verified
 *   server-side; errors surface verbatim).
 * - TOTP enable now lives in a dedicated section (settings/TwoFactorSetupSection,
 *   route /agent-studio/settings/security/two-factor/setup) — the Switch ON
 *   navigates there. Disabling still requires a live authenticator or recovery
 *   code in the request body and revokes every session.
 * - Recovery codes: the activate response is the single moment of existence —
 *   copy-all, download, acknowledged (shown-once marker survives refresh);
 *   rotation is a separate user-initiated action gated behind another live
 *   code, inside the setup section's codes step.
 * - Sessions: live list with per-session and revoke-all.
 * - Security audit: the org's hash-chained audit trail (role-gated).
 * - Danger zone: account deletion with status + cancel.
 */

export function SettingsSecurity() {
  const navigate = useNavigate();
  const mfa = useMfa();
  const { role } = useOrg();
  const canSeeAudit = role !== 'reader';

  const [disableConfirm, setDisableConfirm] = useState(false);
  // Live second-factor codes for the security-sensitive confirms. Cleared
  // from state the moment their mutation settles — never logged, never kept.
  const [disableCode, setDisableCode] = useState('');

  const disable = useDisableTotp();
  const twoFa = mfa.data?.enabled ?? false;

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
                Require a second factor on every sign-in. We support authenticator apps.
              </TwoFaSub>
            </div>
            <Switch
              checked={twoFa}
              onChange={(next) => {
                if (next) {
                  // The enable flow is a dedicated section now (G-6) — it
                  // enrolls on mount and carries the stepped scan/verify/
                  // codes flow with the shown-once recovery codes.
                  navigate({ to: '/agent-studio/settings/security/two-factor/setup' });
                } else {
                  setDisableConfirm(true);
                }
              }}
              disabled={mfa.isPending}
              label="Two-factor authentication"
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

      <Modal
        open={disableConfirm}
        onClose={() => {
          setDisableConfirm(false);
          setDisableCode('');
        }}
        width={440}
        title="Disable two-factor authentication?"
        footer={
          <>
            <GhostBtn
              type="button"
              onClick={() => {
                setDisableConfirm(false);
                setDisableCode('');
              }}
            >
              Cancel
            </GhostBtn>
            <DangerButton
              type="button"
              $destructive
              disabled={disableCode.trim().length === 0 || disable.isPending}
              onClick={() => {
                disable.mutate(
                  { code: disableCode },
                  {
                    onSuccess: () => {
                      toast.success('Two-factor authentication is off');
                      setDisableConfirm(false);
                    },
                    onSettled: () => setDisableCode(''),
                  },
                );
              }}
              style={disableCode.trim().length === 0 || disable.isPending ? { opacity: 0.5, cursor: 'default' } : undefined}
            >
              Disable
            </DangerButton>
          </>
        }
      >
        <DialogCopy>
          Enter a code from your authenticator app — or one of your recovery codes — to confirm.
          Disabling signs out <strong>every session</strong>, including this one; you sign back in
          with your password only. You can turn two-factor back on at any time.
        </DialogCopy>
        <TextInput
          label="Authenticator or recovery code"
          value={disableCode}
          onChange={(e) => setDisableCode(e.target.value)}
          autoComplete="one-time-code"
          inputMode="numeric"
          autoFocus
        />
      </Modal>

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
  const mfa = useMfa();
  const twoFa = mfa.data?.enabled ?? false;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteCode, setDeleteCode] = useState('');

  // P1-10: the engine answers `{ deletion: { scheduled_purge_at } | null }` —
  // pending iff a deletion object is present.
  const pending = deletion.data?.status === 'scheduled' ? deletion.data : null;

  const closeDeleteDialog = () => {
    setConfirmDelete(false);
    setDeletePassword('');
    setDeleteCode('');
  };

  const scheduleDeletion = () => {
    requestDeletion.mutate(
      { currentPassword: deletePassword, code: deleteCode },
      {
        onSuccess: (res) => {
          const when = res?.scheduled_purge_at ? new Date(Date.parse(res.scheduled_purge_at)).toLocaleDateString() : null;
          toast.success(when ? `Deletion scheduled — purge runs ${when}` : 'Deletion scheduled — you can cancel until the purge runs');
          closeDeleteDialog();
        },
        onSettled: () => {
          // Credentials never linger: the password and MFA code are wiped
          // the moment the request settles (same posture as email change).
          setDeletePassword('');
          setDeleteCode('');
        },
      },
    );
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
      <Panel title="Danger zone" subtitle="Irreversible account actions.">
        {pending ? (
          <PendingDelete>
            <AlertTriangle size={15} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <PendingTitle>Deletion scheduled</PendingTitle>
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

      {/* P1-9: the engine re-authenticates deletion (password when one is set,
          live TOTP/recovery code when 2FA is enrolled) — the old dialog sent
          a junk `confirmation` field and always 403'd. */}
      <Modal
        open={confirmDelete}
        onClose={closeDeleteDialog}
        width={440}
        title="Delete your account?"
        footer={
          <>
            <GhostBtn type="button" onClick={closeDeleteDialog}>
              Cancel
            </GhostBtn>
            <DangerButton
              type="button"
              $destructive
              disabled={requestDeletion.isPending}
              onClick={scheduleDeletion}
              style={requestDeletion.isPending ? { opacity: 0.5, cursor: 'default' } : undefined}
            >
              Schedule deletion
            </DangerButton>
          </>
        }
      >
        <DialogCopy>
          This re-authenticates you first: your current password is required when your
          account has one, and a live authenticator or recovery code when two-factor
          authentication is on. Scheduling signs out <strong>every session</strong> immediately —
          the purge itself runs after the grace period, and you can cancel until then.
          Organizations you own should be transferred first.
        </DialogCopy>
        <TextInput
          label="Current password"
          type="password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          autoComplete="current-password"
          hint="Required if your account has a password."
          autoFocus
        />
        {twoFa && (
          <TextInput
            label="Authenticator or recovery code"
            value={deleteCode}
            onChange={(e) => setDeleteCode(e.target.value)}
            autoComplete="one-time-code"
            inputMode="numeric"
            hint="Required while two-factor authentication is on."
          />
        )}
      </Modal>
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

// ─── disable-2FA + account-delete shared bits ─────────────────────────────
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
