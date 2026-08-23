/**
 * /platform/organization/members — the member inventory + invite lifecycle
 * against the engine: search, role changes (canonical vocabulary; owner/admin
 * targets demand a step-up proof), suspend/reactivate, remove, leave, and
 * the pending-invite list with resend/extend/revoke.
 */
import { useState } from 'react';
import styled from 'styled-components';
import { UserPlus, Send, Clock, Ban, ShieldCheck } from 'lucide-react';
import { useMembers, useInvites, type MemberRow, type InviteRow } from '@hooks/engine/queries';
import {
  useInviteMember, useResendInvite, useExtendInvite, useRevokeInvite,
  useChangeRole, useSuspendMember, useReactivateMember, useRemoveMember, useLeaveOrg,
} from '@hooks/engine/mutations';
import { useOrg, ROLE_LABELS, ROLE_SUBTITLES, type OrgRole } from '@/Context/OrgContext';
import { Panel } from '@components/common/ui/Panel/Panel';
import { Modal } from '@components/common/ui/Modal/Modal';
import { TextInput } from '@components/common/ui/TextInput/TextInput';
import { SearchField } from '@components/common/ui/SearchField/SearchField';
import { ActionButton } from '@components/common/ui/ActionButton/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog/ConfirmDialog';
import { StatusPill } from '@components/common/ui/StatusPill/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
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

export default function OrgMembersPage() {
  const { role, canManageMembers } = useOrg();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('developer');
  const [mfaProof, setMfaProof] = useState('');
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
              <ActionButton variant="primary" size="sm" onClick={() => { setInviteEmail(''); setInviteRole('developer'); setMfaProof(''); setInviteOpen(true); }}>
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
                {data.members.map((member) => (
                  <DataRow key={member.accountId}>
                    <DataCell>
                      <CellPrimary>{member.displayName ?? member.email.split('@')[0]}</CellPrimary>
                      <CellMeta>{member.email}{member.emailVerified ? ' ✓' : ''}</CellMeta>
                    </DataCell>
                    <DataCell>
                      {canManageMembers && member.role !== 'owner' ? (
                        <RoleSelect
                          value={member.role}
                          onChange={(e) => changeRole.mutate({ accountId: member.accountId, role: e.target.value })}
                        >
                          {[...ASSIGNABLE_ROLES, ...(role === 'owner' ? (['owner'] as OrgRole[]) : [])].map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </RoleSelect>
                      ) : (
                        ROLE_LABELS[member.role as OrgRole] ?? member.role
                      )}
                    </DataCell>
                    <DataCell>
                      <StatusPill tone={member.status === 'active' ? 'success' : member.status === 'suspended' ? 'warning' : 'neutral'}>
                        {member.status}
                      </StatusPill>
                    </DataCell>
                    <DataCell>
                      <StatusPill tone={member.mfaLevel !== 'none' ? 'success' : 'neutral'}>{member.mfaLevel !== 'none' ? member.mfaLevel : 'off'}</StatusPill>
                    </DataCell>
                    <DataCell><RelativeTime>{timeAgo(member.lastActiveAt ?? member.lastLoginAt)}</RelativeTime></DataCell>
                    <DataCell>
                      {canManageMembers && member.status === 'active' && member.role !== 'owner' && (
                        <ActionButton variant="ghost" size="sm" onClick={() => suspend.mutate({ accountId: member.accountId })}>Suspend</ActionButton>
                      )}
                      {canManageMembers && member.status === 'suspended' && (
                        <ActionButton variant="secondary" size="sm" onClick={() => reactivate.mutate({ accountId: member.accountId })}>Reactivate</ActionButton>
                      )}
                      {canManageMembers && member.role !== 'owner' && role === 'owner' && (
                        <ActionButton variant="ghost" size="sm" onClick={() => setRemoveTarget(member)}>Remove</ActionButton>
                      )}
                    </DataCell>
                  </DataRow>
                ))}
              </tbody>
            </DataTable>
          )}
        </QueryView>
      </Panel>

      {canManageMembers && (
        <>
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
                          {inviteRow.status === 'pending' && (
                            <>
                              <ActionButton variant="ghost" size="sm" onClick={() => resend.mutate({ inviteId: inviteRow.id })}><Send size={12} /> Resend</ActionButton>
                              <ActionButton variant="ghost" size="sm" onClick={() => extend.mutate({ inviteId: inviteRow.id, days: 7 })}><Clock size={12} /> +7d</ActionButton>
                              <ActionButton variant="ghost" size="sm" onClick={() => revoke.mutate({ inviteId: inviteRow.id })}><Ban size={12} /> Revoke</ActionButton>
                            </>
                          )}
                        </DataCell>
                      </DataRow>
                    ))}
                  </tbody>
                </DataTable>
              )}
            </QueryView>
          </Panel>
        </>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a member"
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</ActionButton>
            <ActionButton
              variant="primary"
              disabled={!inviteEmail.includes('@') || invite.isPending}
              onClick={() =>
                invite.mutate(
                  { email: inviteEmail.trim(), role: inviteRole, ...(needsProof && mfaProof ? { mfaProof } : {}) },
                  { onSuccess: () => setInviteOpen(false) },
                )
              }
            >
              Send invitation
            </ActionButton>
          </>
        }
      >
        <Form>
          <TextInput label="Email" name="invite-email" type="email" placeholder="teammate@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          <div>
            <RoleSelect value={inviteRole} onChange={(e) => setInviteRole(e.target.value as OrgRole)} style={{ width: '100%', padding: '8px 10px' }}>
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]} — {ROLE_SUBTITLES[r]}</option>
              ))}
            </RoleSelect>
            <FieldHint>Ownership is transferred, never invited.</FieldHint>
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
          <FieldHint><ShieldCheck size={12} style={{ verticalAlign: -2, marginRight: 4 }} />The invitation link is single-use, email-bound, and expires in 7 days.</FieldHint>
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
