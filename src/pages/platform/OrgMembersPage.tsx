/**
 * /platform/organization/members — the member inventory + invite lifecycle
 * against the engine: search, role changes (canonical vocabulary; owner/admin
 * targets demand a step-up proof), suspend/reactivate, remove, leave, and
 * the pending-invite list with resend/extend/revoke.
 *
 * Team-loop ledger T1/T2/T4:
 *  - invite create sends `delivery?: 'email' | 'manual'` (manual PRIMARY);
 *    manual returns `accept_url` ONCE → shown-once panel (masked while open,
 *    Copy + Compose email + Done; secret leaves memory on Done, never in
 *    localStorage/toast/telemetry).
 *  - `admin` role option is owner-only (server 403 is the backstop, the UI
 *    hides it first); invites list is readable by every role (actions gated);
 *    suspend refuses self/owner targets; remove follows the §4 matrix.
 */
import { useState } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { UserPlus, Send, Clock, Ban, ShieldCheck, Mail, Link2 } from 'lucide-react';
import { useMembers, useInvites, type MemberRow, type InviteRow } from '@hooks/engine/queries';
import {
  useInviteMember, useResendInvite, useExtendInvite, useRevokeInvite,
  useChangeRole, useSuspendMember, useReactivateMember, useRemoveMember, useLeaveOrg,
  type InviteDelivery, type InviteCreateResult, type InviteResendResult,
} from '@hooks/engine/mutations';
import { useOrg, ROLE_LABELS, ROLE_SUBTITLES, type OrgRole } from '@/Context/OrgContext';
import { useSessionStore } from '@lib/engine/auth';
import { ApiError } from '@lib/engine/client';
import { Panel } from '@components/common/ui/Panel/Panel';
import { Modal } from '@components/common/ui/Modal/Modal';
import { TextInput } from '@components/common/ui/TextInput/TextInput';
import { SearchField } from '@components/common/ui/SearchField/SearchField';
import { ActionButton } from '@components/common/ui/ActionButton/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog/ConfirmDialog';
import { StatusPill } from '@components/common/ui/StatusPill/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { CopyButton } from '@components/common/ui/CopyButton';
import { DataTable, DataHead, DataRow, DataCell, CellPrimary, CellMeta } from '@components/common/ui/DataTable';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, SectionTitle, Toolbar, ToolbarGroup } from '@components/common/ui/ViewLayout';

const ASSIGNABLE_ROLES: OrgRole[] = ['admin', 'billing', 'developer', 'reader'];

const RoleSelect = styled.select`
  background: rgba(255, 255, 255, 0.05);
  color: #eceef4;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
`;

const FieldHint = styled.p`
  margin: -6px 0 0;
  font-size: 12px;
  opacity: 0.6;
`;

const RelativeTime = styled.span`
  font-size: 12px;
  opacity: 0.6;
`;

const RadioRow = styled.div`
  display: flex;
  gap: 8px;
`;

const RadioCard = styled.label<{ $active: boolean }>`
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  border: 1px solid ${(p) => (p.$active ? 'rgba(5, 227, 164, 0.55)' : 'rgba(255, 255, 255, 0.1)')};
  background: ${(p) => (p.$active ? 'rgba(5, 227, 164, 0.07)' : 'rgba(255, 255, 255, 0.02)')};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.5;
  cursor: pointer;
`;

const InlineError = styled.div`
  border: 1px solid rgba(248, 113, 113, 0.4);
  background: rgba(248, 113, 113, 0.08);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12.5px;
  line-height: 1.5;
`;

const OncePanel = styled.div`
  border: 1px solid rgba(5, 227, 164, 0.35);
  background: rgba(5, 227, 164, 0.06);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const OnceTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
`;

const OnceText = styled.p`
  margin: 0;
  font-size: 12px;
  opacity: 0.75;
  line-height: 1.55;
`;

const OnceLinkRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const OnceLinkField = styled.input`
  flex: 1;
  background: rgba(0, 0, 0, 0.35);
  color: #eceef4;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  font-family: ui-monospace, monospace;
`;

const OnceActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

function timeAgo(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const seconds = Math.floor((Date.now() - Date.parse(iso)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

function validDaysLabel(expiresAt: string | undefined): string {
  if (!expiresAt) return '7';
  const ms = Date.parse(expiresAt) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return '7';
  return String(Math.max(1, Math.ceil(ms / 86_400_000)));
}

function isMemberSuspendedError(error: unknown): boolean {
  if (error instanceof ApiError) {
    const details = error.details as { reason?: string } | undefined;
    if (details?.reason === 'member_suspended') return true;
    return /suspended member/i.test(error.message);
  }
  return false;
}

function buildMailto(input: {
  invitee: string;
  orgName: string;
  role: OrgRole;
  acceptUrl: string;
  expiresAt?: string;
  inviter: string;
}): string {
  const subject = `You've been invited to ${input.orgName} as ${ROLE_LABELS[input.role]}`;
  const body = [
    `${input.inviter} invited you to join ${input.orgName} as ${ROLE_LABELS[input.role]}.`,
    `${ROLE_SUBTITLES[input.role]}.`,
    '',
    input.acceptUrl,
    '',
    `This link is valid ${validDaysLabel(input.expiresAt)} days and is single-use.`,
    `Sign in with ${input.invitee} — other addresses will be rejected.`,
  ].join('\n');
  return `mailto:${encodeURIComponent(input.invitee)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function OrgMembersPage() {
  const { role, name: orgName, canManageMembers } = useOrg();
  const myId = useSessionStore((s) => s.account?.id ?? null);
  const myEmail = useSessionStore((s) => s.account?.email ?? 'a member of your team');
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('developer');
  const [inviteDelivery, setInviteDelivery] = useState<InviteDelivery>('manual');
  const [mfaProof, setMfaProof] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuspended, setInviteSuspended] = useState(false);
  const [manualResult, setManualResult] = useState<(InviteCreateResult | InviteResendResult) & { email: string; role: OrgRole } | null>(null);
  const [resendDelivery, setResendDelivery] = useState<InviteDelivery>('email');
  const [resendTarget, setResendTarget] = useState<InviteRow | null>(null);
  const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null);

  const members = useMembers({ q: search || undefined, limit: 100 });
  const invites = useInvites();

  const invite = useInviteMember();
  const resend = useResendInvite();
  const extend = useExtendInvite();
  const revoke = useRevokeInvite();
  const changeRole = useChangeRole();
  const suspend = useSuspendMember();
  const reactivate = useReactivateMember();
  const remove = useRemoveMember();
  const leave = useLeaveOrg();

  const needsProof = inviteRole === 'admin';
  const isOwner = role === 'owner';
  // Owner-only reserves: inviting/assigning `admin` (server 403s otherwise —
  // the UI hides first, the server remains authoritative).

  const openInvite = () => {
    setInviteEmail('');
    setInviteRole('developer');
    setInviteDelivery('manual');
    setMfaProof('');
    setInviteError(null);
    setInviteSuspended(false);
    setManualResult(null);
    setInviteOpen(true);
  };

  const closeInvite = () => {
    // Shown-once secret leaves memory on Done/close — never persisted.
    setManualResult(null);
    setInviteError(null);
    setInviteSuspended(false);
    setInviteOpen(false);
  };

  const sendInvite = () => {
    const trimmed = inviteEmail.trim();
    if (!trimmed.includes('@')) {
      setInviteError('Enter a valid email address.');
      setInviteSuspended(false);
      return;
    }
    if (inviteRole === 'admin' && !isOwner) {
      setInviteError('Only an owner may invite someone as admin.');
      setInviteSuspended(false);
      return;
    }
    setInviteError(null);
    setInviteSuspended(false);
    invite.mutate(
      { email: trimmed, role: inviteRole, delivery: inviteDelivery, ...(needsProof && mfaProof ? { mfaProof } : {}) },
      {
        onSuccess: (result) => {
          if (inviteDelivery === 'manual' && result.accept_url) {
            // Shown-once panel — do NOT close, do NOT toast the secret.
            setManualResult({ ...result, email: trimmed, role: inviteRole });
            return;
          }
          toast.success(`Invitation sent to ${trimmed}`);
          closeInvite();
        },
        onError: (error) => {
          if (isMemberSuspendedError(error)) {
            // Verbatim server copy + explicit path (we are already in Members —
            // point at the suspended row via search).
            setInviteSuspended(true);
            setInviteError(
              error instanceof ApiError
                ? error.message
                : 'This email belongs to a suspended member — reactivate them in the Members tab instead.',
            );
            return;
          }
          setInviteSuspended(false);
          setInviteError(error instanceof ApiError ? error.message : 'Could not send the invitation — try again.');
        },
      },
    );
  };

  const sendResend = (row: InviteRow, delivery: InviteDelivery) => {
    resend.mutate(
      { inviteId: row.id, delivery },
      {
        onSuccess: (result) => {
          if (delivery === 'manual' && result.accept_url) {
            setManualResult({ ...result, email: row.email, role: row.role as OrgRole });
            setResendTarget(null);
            setInviteOpen(true);
            return;
          }
          toast.success('Invitation re-sent with a fresh link');
          setResendTarget(null);
        },
      },
    );
  };

  const manualMailto = manualResult
    ? buildMailto({
        invitee: manualResult.email,
        orgName: orgName ?? 'your workspace',
        role: manualResult.role,
        acceptUrl: manualResult.accept_url ?? '',
        expiresAt: manualResult.expires_at,
        inviter: myEmail ?? 'a member of your team',
      })
    : '';

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Members</ViewTitle>
        <ViewSubtitle>Who is in this organization, their access, and pending invitations.</ViewSubtitle>
      </ViewHeader>

      <Panel
        title="Member inventory"
        flush
        action={
          <Toolbar>
            <ToolbarGroup>
              <SearchField value={search} onChange={setSearch} placeholder="Search email or name…" />
            </ToolbarGroup>
            {canManageMembers && (
              <ActionButton variant="primary" size="sm" onClick={openInvite}>
                <UserPlus size={13} /> Invite
              </ActionButton>
            )}
            {role && (
              <ActionButton variant="ghost" size="sm" onClick={() => leave.mutate()}>
                Leave org
              </ActionButton>
            )}
          </Toolbar>
        }
      >
        <QueryView query={members} skeleton={<div style={{ padding: 20 }}><Skeleton $h="16px" /><Skeleton $h="16px" /><Skeleton $h="16px" /></div>} isEmpty={(d) => d.members.length === 0} empty={{ title: 'No members match', description: 'Try a different search.' }}>
          {(data) => (
            <DataTable>
              <thead>
                <DataHead>
                  <DataCell as="th">Member</DataCell>
                  <DataCell as="th">Role</DataCell>
                  <DataCell as="th">Status</DataCell>
                  <DataCell as="th">MFA</DataCell>
                  <DataCell as="th">Last active</DataCell>
                  <DataCell as="th" />
                </DataHead>
              </thead>
              <tbody>
                {data.members.map((member) => {
                  const isSelf = myId !== null && member.accountId === myId;
                  const isOwnerTarget = member.role === 'owner';
                  const isAdminTarget = member.role === 'admin';
                  // §4 matrix: admins never see owner/admin as assignable
                  // (server 403s regardless). Ownership moves ONLY via the
                  // step-up-gated transfer in Org settings → Danger zone —
                  // offering `owner` here would guarantee a 409 (the
                  // exactly-one-owner index), so it is deliberately absent.
                  const changeableRoles = isOwner
                    ? ASSIGNABLE_ROLES
                    : ASSIGNABLE_ROLES.filter((r) => r !== 'admin');
                  const canChangeThis = canManageMembers && !isOwnerTarget;
                  const canSuspendThis = canManageMembers && member.status === 'active' && !isOwnerTarget && !isSelf;
                  const canRemoveThis =
                    canManageMembers &&
                    !isOwnerTarget &&
                    !(role === 'admin' && isAdminTarget) &&
                    !isSelf;
                  return (
                    <DataRow key={member.accountId}>
                      <DataCell>
                        <CellPrimary>{member.displayName ?? member.email.split('@')[0]}</CellPrimary>
                        <CellMeta>{member.email}{member.emailVerified ? ' ✓' : ''}{isSelf ? ' (you)' : ''}</CellMeta>
                      </DataCell>
                      <DataCell>
                        {canChangeThis ? (
                          <RoleSelect
                            value={member.role}
                            aria-label={`Change role for ${member.email}`}
                            onChange={(e) => changeRole.mutate({ accountId: member.accountId, role: e.target.value })}
                          >
                            {changeableRoles.map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </RoleSelect>
                        ) : (
                          ROLE_LABELS[member.role as OrgRole] ?? member.role
                        )}
                      </DataCell>
                      <DataCell>
                        <span title={member.status === 'suspended' && member.suspendedAt ? `Suspended ${new Date(member.suspendedAt).toLocaleDateString()}` : undefined}>
                          <StatusPill tone={member.status === 'active' ? 'success' : member.status === 'suspended' ? 'warning' : 'neutral'}>
                            {member.status}
                          </StatusPill>
                        </span>
                      </DataCell>
                      <DataCell>
                        <StatusPill tone={member.mfaLevel !== 'none' ? 'success' : 'neutral'}>{member.mfaLevel !== 'none' ? member.mfaLevel : 'off'}</StatusPill>
                      </DataCell>
                      <DataCell><RelativeTime>{timeAgo(member.lastActiveAt ?? member.lastLoginAt)}</RelativeTime></DataCell>
                      <DataCell>
                        {canSuspendThis && (
                          <ActionButton variant="ghost" size="sm" onClick={() => suspend.mutate({ accountId: member.accountId })}>Suspend</ActionButton>
                        )}
                        {canManageMembers && member.status === 'suspended' && !isSelf && (
                          <ActionButton variant="secondary" size="sm" onClick={() => reactivate.mutate({ accountId: member.accountId })}>Reactivate</ActionButton>
                        )}
                        {canRemoveThis && (
                          <ActionButton variant="ghost" size="sm" onClick={() => setRemoveTarget(member)}>Remove</ActionButton>
                        )}
                      </DataCell>
                    </DataRow>
                  );
                })}
              </tbody>
            </DataTable>
          )}
        </QueryView>
      </Panel>

      <SectionTitle>Pending invitations</SectionTitle>
      <Panel flush>
        <QueryView query={invites} isEmpty={(d) => d.invites.length === 0} empty={{ title: 'No invitations', description: 'Invite teammates from the button above.' }}>
          {(data) => (
            <DataTable>
              <thead>
                <DataHead>
                  <DataCell as="th">Email</DataCell>
                  <DataCell as="th">Role</DataCell>
                  <DataCell as="th">State</DataCell>
                  <DataCell as="th">Expires</DataCell>
                  <DataCell as="th" />
                </DataHead>
              </thead>
              <tbody>
                {data.invites.map((inviteRow: InviteRow) => (
                  <DataRow key={inviteRow.id}>
                    <DataCell><CellPrimary>{inviteRow.email}</CellPrimary></DataCell>
                    <DataCell>{ROLE_LABELS[inviteRow.role as OrgRole] ?? inviteRow.role}</DataCell>
                    <DataCell>
                      <StatusPill tone={inviteRow.status === 'pending' ? 'azure' : inviteRow.status === 'accepted' ? 'success' : 'neutral'}>
                        {inviteRow.status}
                      </StatusPill>
                    </DataCell>
                    <DataCell><RelativeTime>{new Date(inviteRow.expiresAt).toLocaleDateString()}</RelativeTime></DataCell>
                    <DataCell>
                      {inviteRow.status === 'pending' && canManageMembers && (
                        <>
                          <ActionButton variant="ghost" size="sm" onClick={() => { setResendDelivery('email'); setResendTarget(inviteRow); }}><Send size={12} /> Resend</ActionButton>
                          <ActionButton variant="ghost" size="sm" onClick={() => extend.mutate({ inviteId: inviteRow.id, days: 7 })}><Clock size={12} /> +7d</ActionButton>
                          <ActionButton variant="ghost" size="sm" onClick={() => revoke.mutate({ inviteId: inviteRow.id })}><Ban size={12} /> Revoke</ActionButton>
                        </>
                      )}
                      {inviteRow.status === 'pending' && !canManageMembers && (
                        <RelativeTime>Awaiting owner/admin action</RelativeTime>
                      )}
                    </DataCell>
                  </DataRow>
                ))}
              </tbody>
            </DataTable>
          )}
        </QueryView>
      </Panel>

      <Modal
        open={inviteOpen}
        onClose={closeInvite}
        title={manualResult ? 'Share the invitation link' : 'Invite a member'}
        footer={
          manualResult ? (
            <>
              <ActionButton variant="ghost" onClick={closeInvite}>Done</ActionButton>
            </>
          ) : (
            <>
              <ActionButton variant="ghost" onClick={closeInvite}>Cancel</ActionButton>
              <ActionButton
                variant="primary"
                disabled={!inviteEmail.includes('@') || invite.isPending}
                onClick={sendInvite}
              >
                {inviteDelivery === 'manual' ? 'Create link' : 'Send invitation'}
              </ActionButton>
            </>
          )
        }
      >
        {manualResult && manualResult.accept_url ? (
          <OncePanel>
            <OnceTitle>Copy this link now</OnceTitle>
            <OnceText>
              For security this link is shown once — resend to generate a new one. It is single-use,
              email-bound to {manualResult.email}, and expires {new Date(manualResult.expires_at ?? '').toLocaleDateString()}.
              Copy is not re-offered on stored rows: rotation-only re-access.
            </OnceText>
            <OnceLinkRow>
              <OnceLinkField readOnly value={manualResult.accept_url} aria-label="One-time invitation link" onFocus={(e) => e.target.select()} />
              <CopyButton value={manualResult.accept_url} label="Copy link" />
            </OnceLinkRow>
            <OnceActions>
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => { window.location.href = manualMailto; }}
              >
                <Mail size={12} /> Compose email
              </ActionButton>
              <ActionButton variant="ghost" size="sm" onClick={closeInvite}>
                <Link2 size={12} /> Done
              </ActionButton>
            </OnceActions>
            <FieldHint>
              <ShieldCheck size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
              The link never appears in lists, audit rows, or logs (hash-only storage). Forward it in your own mailbox or chat.
            </FieldHint>
          </OncePanel>
        ) : (
          <Form>
            <TextInput label="Email" name="invite-email" type="email" placeholder="teammate@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <div>
              <RoleSelect value={inviteRole} onChange={(e) => setInviteRole(e.target.value as OrgRole)} style={{ width: '100%', padding: '8px 10px' }} aria-label="Invite role">
                {(isOwner ? ASSIGNABLE_ROLES : ASSIGNABLE_ROLES.filter((r) => r !== 'admin')).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]} — {ROLE_SUBTITLES[r]}</option>
                ))}
              </RoleSelect>
              <FieldHint>Ownership is transferred, never invited.{!isOwner ? ' Inviting as admin requires an owner.' : ''}</FieldHint>
            </div>
            <div>
              <RadioRow role="radiogroup" aria-label="Delivery method">
                <RadioCard $active={inviteDelivery === 'manual'}>
                  <input
                    type="radio"
                    name="invite-delivery"
                    checked={inviteDelivery === 'manual'}
                    onChange={() => setInviteDelivery('manual')}
                    aria-label="Manual copy-link delivery"
                  />
                  <span><strong>Manual / copy-link (primary).</strong> We create the link and show it once — you forward it. Bypasses quarantine-prone invite mail.</span>
                </RadioCard>
                <RadioCard $active={inviteDelivery === 'email'}>
                  <input
                    type="radio"
                    name="invite-delivery"
                    checked={inviteDelivery === 'email'}
                    onChange={() => setInviteDelivery('email')}
                    aria-label="Email delivery"
                  />
                  <span><strong>Email.</strong> The engine sends the invitation email. Nothing secret returns.</span>
                </RadioCard>
              </RadioRow>
            </div>
            {needsProof && (
              <TextInput
                label="MFA proof (admin invites are privileged)"
                name="invite-mfa"
                placeholder="v1.… (from your authenticator step-up)"
                value={mfaProof}
                onChange={(e) => setMfaProof(e.target.value)}
                hint="Inviting someone as admin requires a fresh MFA proof (X-MFA-Proof)."
              />
            )}
            {inviteError && (
              <InlineError role="alert">
                {inviteError}
                {inviteSuspended && (
                  <div style={{ marginTop: 8 }}>
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setInviteError(null);
                        setInviteSuspended(false);
                        setSearch(inviteEmail.trim());
                      }}
                    >
                      Find the suspended member
                    </ActionButton>
                  </div>
                )}
              </InlineError>
            )}
            <FieldHint><ShieldCheck size={12} style={{ verticalAlign: -2, marginRight: 4 }} />The invitation link is single-use, email-bound, and expires in 7 days.</FieldHint>
          </Form>
        )}
      </Modal>

      <Modal
        open={resendTarget !== null}
        onClose={() => { if (!resend.isPending) setResendTarget(null); }}
        title={`Resend to ${resendTarget?.email ?? ''}`}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setResendTarget(null)} disabled={resend.isPending}>Cancel</ActionButton>
            <ActionButton
              variant="primary"
              disabled={resend.isPending || !resendTarget}
              onClick={() => { if (resendTarget) sendResend(resendTarget, resendDelivery); }}
            >
              {resendDelivery === 'manual' ? 'Rotate + show link' : 'Re-send email'}
            </ActionButton>
          </>
        }
      >
        <Form>
          <FieldHint>Resend rotates the token — the previous link dies immediately. Capped at 5 resends per invite.</FieldHint>
          <RadioRow role="radiogroup" aria-label="Resend delivery method">
            <RadioCard $active={resendDelivery === 'email'}>
              <input type="radio" name="resend-delivery" checked={resendDelivery === 'email'} onChange={() => setResendDelivery('email')} aria-label="Resend by email" />
              <span><strong>Email.</strong> Re-emails the rotated link.</span>
            </RadioCard>
            <RadioCard $active={resendDelivery === 'manual'}>
              <input type="radio" name="resend-delivery" checked={resendDelivery === 'manual'} onChange={() => setResendDelivery('manual')} aria-label="Resend as manual link" />
              <span><strong>Manual.</strong> Returns the new link once (shown-once panel).</span>
            </RadioCard>
          </RadioRow>
        </Form>
      </Modal>

      <ConfirmDialog
        open={removeTarget !== null}
        title={`Remove ${removeTarget?.email ?? 'member'}?`}
        message="They immediately lose access to this organization. Group memberships are cleaned up too."
        confirmLabel="Remove member"
        destructive
        onConfirm={() => {
          if (removeTarget) {
            remove.mutate({ accountId: removeTarget.accountId });
          }
          setRemoveTarget(null);
        }}
        onCancel={() => setRemoveTarget(null)}
      />
    </ViewShell>
  );
}
