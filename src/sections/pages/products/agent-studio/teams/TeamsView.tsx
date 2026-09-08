import { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Users, Mail, Clock, ShieldCheck, RefreshCw, Power, Trash2 } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle, SectionTitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { CopyButton } from '@components/common/ui/CopyButton';
import { pageItem } from '@styles/motion';
import { useOrg } from '@/Context/OrgContext';
import type { OrgRole } from '@/Context/OrgContext';
import {
  useOrgSummary,
  useMembers,
  useInvites,
  useGroups,
  useServiceAccounts,
} from '@hooks/engine/queries';
import {
  useInviteMember,
  useResendInvite,
  useRevokeInvite,
  useCreateGroup,
  useDeleteGroup,
  useCreateServiceAccount,
  useRotateServiceAccountToken,
  useDisableServiceAccount,
  useEnableServiceAccount,
} from '@hooks/engine/mutations';
import { useDeleteServiceAccount } from '@hooks/studio/useStudioTeams';
import {
  TotalsGrid,
  TotalCard,
  TotalLabel,
  TotalValue,
  TotalMeta,
  MemberCell,
  Avatar,
  MemberInfo,
  MemberName,
  MemberEmail,
  PendingCard,
  PendingRow,
  PendingEmail,
  PendingMeta,
  PendingActions,
  GroupGrid,
  GroupCard,
  GroupTop,
  GroupName,
  GroupDesc,
  GroupBottom,
  GroupMembers,
  ServiceGrid,
  ServiceCard,
  ServiceTop,
  ServiceName,
  ServiceOwner,
  ServiceMeta,
  MetaItem,
  MetaLabel,
  MetaValue,
  ScopeRow,
  ScopePill,
  InviteForm,
  InviteLabel,
  InviteInput,
} from './TeamsView.styles';

/**
 * Teams (ledger T-6) — the org-furniture plane, proxied from the studio
 * (this resolves decision D-2: the page shows the same engine-backed
 * members/invites/groups/service-accounts the /platform console serves;
 * product-scoped role mapping lands with the entitlements work).
 *
 * Service-account tokens are revealed exactly once on create/rotate.
 */

const ROLE_TONES: Record<OrgRole, StatusTone> = {
  owner: 'lilac',
  admin: 'azure',
  billing: 'emerald',
  developer: 'azure',
  reader: 'neutral',
};

const INVITE_ROLES: OrgRole[] = ['admin', 'billing', 'developer', 'reader'];

export function TeamsView() {
  const { canManageMembers } = useOrg();
  const summary = useOrgSummary();
  const members = useMembers();
  const invites = useInvites();
  const [inviteOpen, setInviteOpen] = useState(false);

  const seat = summary.data?.seats.find((s) => s.product === 'agent_studio') ?? summary.data?.seats[0];

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Teams</ViewTitle>
          <ViewSubtitle>
            Manage workspace members, invitations, service accounts, and access groups.
          </ViewSubtitle>
        </ViewHeader>
        {canManageMembers && (
          <ActionButton size="sm" onClick={() => setInviteOpen(true)}>
            <Plus size={14} strokeWidth={2} />
            Invite member
          </ActionButton>
        )}
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <QueryView query={summary} skeleton={<Skeleton $h="120px" $r="12px" />}>
          {(data) => (
            <TotalsGrid>
              <TotalCard>
                <TotalLabel>Seats</TotalLabel>
                <TotalValue>{seat?.seats ? `${seat.activeMembers}/${seat.seats}` : data.members.total}</TotalValue>
                <TotalMeta>{seat?.seats ? 'utilization' : 'total members'}</TotalMeta>
              </TotalCard>
              <TotalCard>
                <TotalLabel>Active members</TotalLabel>
                <TotalValue $tone="success">{data.members.active}</TotalValue>
                <TotalMeta>{data.members.suspended} suspended</TotalMeta>
              </TotalCard>
              <TotalCard>
                <TotalLabel>Pending invites</TotalLabel>
                <TotalValue $tone="warning">{data.pendingInvites}</TotalValue>
                <TotalMeta>awaiting accept</TotalMeta>
              </TotalCard>
              <TotalCard>
                <TotalLabel>Service accounts</TotalLabel>
                <TotalValue>{data.serviceAccounts.total}</TotalValue>
                <TotalMeta>{data.serviceAccounts.active} active</TotalMeta>
              </TotalCard>
              <TotalCard>
                <TotalLabel>Groups</TotalLabel>
                <TotalValue>{data.groups}</TotalValue>
                <TotalMeta>RBAC containers</TotalMeta>
              </TotalCard>
            </TotalsGrid>
          )}
        </QueryView>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionTitle>
          <Users size={14} strokeWidth={1.7} />
          Members
        </SectionTitle>
        <Panel flush>
          <QueryView query={members} skeleton={<Skeleton $h="240px" $r="12px" />} isEmpty={(d) => d.members.length === 0} empty={{ title: 'No members yet', description: 'Invite teammates to collaborate.' }}>
            {(data) => (
              <DataTable>
                <DataHead>
                  <DataCell $w="36%">Member</DataCell>
                  <DataCell $w="16%">Role</DataCell>
                  <DataCell $w="18%">Last active</DataCell>
                  <DataCell $w="18%">Joined</DataCell>
                  <DataCell $w="12%">2FA</DataCell>
                </DataHead>
                {data.members.map((m, i) => {
                  const role = m.role as OrgRole;
                  const displayName = m.displayName ?? m.email;
                  return (
                    <DataRow
                      key={m.accountId}
                      as={motion.div}
                      initial="hidden"
                      animate="visible"
                      variants={pageItem}
                      custom={i + 3}
                      $interactive={false}
                    >
                      <DataCell $w="36%">
                        <MemberCell>
                          <Avatar $tone={ROLE_TONES[role] ?? 'azure'}>{initialsOf(displayName)}</Avatar>
                          <MemberInfo>
                            <MemberName>{displayName}</MemberName>
                            <MemberEmail>{m.email}</MemberEmail>
                          </MemberInfo>
                        </MemberCell>
                      </DataCell>
                      <DataCell $w="16%">
                        <StatusPill tone={ROLE_TONES[role] ?? 'neutral'} dot={false}>
                          {role}
                        </StatusPill>
                      </DataCell>
                      <DataCell $w="18%">
                        <MemberEmail as="div">{m.lastActiveAt ? shortDate(m.lastActiveAt) : '—'}</MemberEmail>
                      </DataCell>
                      <DataCell $w="18%">
                        <MemberEmail as="div">{shortDate(m.memberSince)}</MemberEmail>
                      </DataCell>
                      <DataCell $w="12%">
                        {m.mfaLevel && m.mfaLevel !== 'none' ? (
                          <StatusPill tone="success" dot={false}>2FA</StatusPill>
                        ) : (
                          <MemberEmail as="div">—</MemberEmail>
                        )}
                      </DataCell>
                    </DataRow>
                  );
                })}
              </DataTable>
            )}
          </QueryView>
        </Panel>
      </motion.div>

      {canManageMembers && (invites.data?.invites.filter((i) => i.status === 'pending').length ?? 0) > 0 && (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={14}>
          <SectionTitle>
            <Mail size={14} strokeWidth={1.7} />
            Pending invites
          </SectionTitle>
          <PendingInvitesCard />
        </motion.div>
      )}

      {canManageMembers && <GroupsSection />}

      {canManageMembers && <ServiceAccountsSection />}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </ViewShell>
  );
}

function initialsOf(name: string): string {
  return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

function shortDate(iso: string): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) {
    return iso;
  }
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
}

// ─── Pending invites ─────────────────────────────────────────────────
function PendingInvitesCard() {
  const invites = useInvites();
  const resend = useResendInvite();
  const revoke = useRevokeInvite();
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; email: string } | null>(null);
  const pending = (invites.data?.invites ?? []).filter((i) => i.status === 'pending');

  return (
    <>
      <PendingCard>
        {pending.map((p) => (
          <PendingRow key={p.id}>
            <div>
              <PendingEmail>{p.email}</PendingEmail>
              <PendingMeta>
                {p.role} · expires {shortDate(p.expiresAt)}
              </PendingMeta>
            </div>
            <PendingActions>
              <ActionButton
                size="sm"
                disabled={resend.isPending}
                onClick={() => resend.mutate({ inviteId: p.id }, { onSuccess: () => toast.success(`Invite re-sent to ${p.email}`) })}
              >
                Resend
              </ActionButton>
              <ActionButton
                variant="secondary"
                size="sm"
                disabled={revoke.isPending}
                onClick={() => setRevokeTarget({ id: p.id, email: p.email })}
              >
                Revoke
              </ActionButton>
            </PendingActions>
          </PendingRow>
        ))}
      </PendingCard>

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoke this invite?"
        message={revokeTarget ? `The link sent to ${revokeTarget.email} stops working immediately.` : ''}
        destructive
        confirmLabel="Revoke invite"
        onConfirm={() => {
          if (revokeTarget) {
            revoke.mutate({ inviteId: revokeTarget.id }, { onSuccess: () => toast.success('Invite revoked') });
          }
          setRevokeTarget(null);
        }}
        onCancel={() => setRevokeTarget(null)}
      />
    </>
  );
}

// ─── Groups ──────────────────────────────────────────────────────────
function GroupsSection() {
  const groups = useGroups();
  const create = useCreateGroup();
  const remove = useDeleteGroup();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={15}>
        <SectionTitle>
          <ShieldCheck size={14} strokeWidth={1.7} />
          Groups
          <ActionButton size="sm" variant="secondary" onClick={() => { setName(''); setDescription(''); setCreateOpen(true); }}>
            <Plus size={13} strokeWidth={2} />
            New group
          </ActionButton>
        </SectionTitle>
        <QueryView query={groups} skeleton={<Skeleton $h="140px" $r="12px" />} isEmpty={(d) => d.groups.length === 0} empty={{ title: 'No groups', description: 'Groups bundle members for shared access — create one to get started.' }}>
          {(data) => (
            <GroupGrid>
              {data.groups.map((g, i) => (
                <GroupCard
                  key={g.id}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={pageItem}
                  custom={i + 16}
                >
                  <GroupTop>
                    <GroupName>{g.name}</GroupName>
                    <StatusPill tone="azure" dot={false}>
                      {g.memberCount} member{g.memberCount === 1 ? '' : 's'}
                    </StatusPill>
                  </GroupTop>
                  {g.description && <GroupDesc>{g.description}</GroupDesc>}
                  <GroupBottom>
                    <GroupMembers>Group</GroupMembers>
                    <IconGhostBtn type="button" aria-label={`Delete group ${g.name}`} onClick={() => setDeleteTarget({ id: g.id, name: g.name })}>
                      <Trash2 size={13} strokeWidth={1.7} />
                    </IconGhostBtn>
                  </GroupBottom>
                </GroupCard>
              ))}
            </GroupGrid>
          )}
        </QueryView>
      </motion.div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a group"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</ActionButton>
            <ActionButton
              disabled={!name.trim() || create.isPending}
              onClick={() => create.mutate(
                { name: name.trim(), description: description.trim() || undefined },
                { onSuccess: () => { toast.success('Group created'); setCreateOpen(false); } },
              )}
            >
              Create group
            </ActionButton>
          </>
        }
      >
        <InviteForm>
          <InviteLabel>
            Group name
            <InviteInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Support agents" autoFocus />
          </InviteLabel>
          <InviteLabel>
            Description
            <InviteInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this group is for" />
          </InviteLabel>
        </InviteForm>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this group?"
        message={deleteTarget ? `"${deleteTarget.name}" stops applying its access immediately. Members keep their own roles.` : ''}
        destructive
        confirmLabel="Delete group"
        onConfirm={() => {
          if (deleteTarget) {
            remove.mutate({ groupId: deleteTarget.id }, { onSuccess: () => toast.success('Group deleted') });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

// ─── Service accounts ────────────────────────────────────────────────
function ServiceAccountsSection() {
  const accounts = useServiceAccounts();
  const create = useCreateServiceAccount();
  const rotate = useRotateServiceAccountToken();
  const disable = useDisableServiceAccount();
  const enable = useEnableServiceAccount();
  const del = useDeleteServiceAccount();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scopes, setScopes] = useState('studio:read');
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [rotateTarget, setRotateTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={21}>
        <SectionTitle>
          <Clock size={14} strokeWidth={1.7} />
          Service accounts
          <ActionButton size="sm" variant="secondary" onClick={() => { setName(''); setDescription(''); setScopes('studio:read'); setCreateOpen(true); }}>
            <Plus size={13} strokeWidth={2} />
            New service account
          </ActionButton>
        </SectionTitle>
        <QueryView query={accounts} skeleton={<Skeleton $h="160px" $r="12px" />} isEmpty={(d) => d.serviceAccounts.length === 0} empty={{ title: 'No service accounts', description: 'Machine accounts for CI and integrations — their token is shown exactly once.' }}>
          {(data) => (
            <ServiceGrid>
              {data.serviceAccounts.map((s, i) => (
                <ServiceCard
                  key={s.id}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={pageItem}
                  custom={i + 22}
                >
                  <ServiceTop>
                    <div>
                      <ServiceName>{s.name}</ServiceName>
                      <ServiceOwner>{s.description ?? 'Machine account'}</ServiceOwner>
                    </div>
                    <StatusPill tone={s.status === 'active' ? 'lilac' : 'neutral'} dot={false}>{s.status}</StatusPill>
                  </ServiceTop>
                  <ServiceMeta>
                    <MetaItem>
                      <MetaLabel>Last used</MetaLabel>
                      <MetaValue>{s.tokenLastUsedAt ? shortDate(s.tokenLastUsedAt) : 'never'}</MetaValue>
                    </MetaItem>
                    <MetaItem>
                      <MetaLabel>Scopes</MetaLabel>
                      <MetaValue>{s.scopes.length}</MetaValue>
                    </MetaItem>
                  </ServiceMeta>
                  <ScopeRow>
                    {s.scopes.map((sc) => (
                      <ScopePill key={sc}>{sc}</ScopePill>
                    ))}
                  </ScopeRow>
                  <ServiceActions>
                    <IconGhostBtn
                      type="button"
                      aria-label={`Rotate token for ${s.name}`}
                      title="Rotate token"
                      disabled={rotate.isPending}
                      onClick={() => { setRotateTarget({ id: s.id, name: s.name }); setIssuedToken(null); }}
                    >
                      <RefreshCw size={13} strokeWidth={1.7} />
                    </IconGhostBtn>
                    <IconGhostBtn
                      type="button"
                      aria-label={s.status === 'active' ? `Disable ${s.name}` : `Enable ${s.name}`}
                      title={s.status === 'active' ? 'Disable' : 'Enable'}
                      disabled={disable.isPending || enable.isPending}
                      onClick={() => (s.status === 'active'
                        ? disable.mutate({ id: s.id }, { onSuccess: () => toast.success('Service account disabled') })
                        : enable.mutate({ id: s.id }, { onSuccess: () => toast.success('Service account enabled') }))}
                    >
                      <Power size={13} strokeWidth={1.7} />
                    </IconGhostBtn>
                    <IconGhostBtn
                      type="button"
                      aria-label={`Delete ${s.name}`}
                      title="Delete"
                      disabled={del.isPending}
                      onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                    >
                      <Trash2 size={13} strokeWidth={1.7} />
                    </IconGhostBtn>
                  </ServiceActions>
                </ServiceCard>
              ))}
            </ServiceGrid>
          )}
        </QueryView>
      </motion.div>

      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setIssuedToken(null); }}
        title={issuedToken ? 'Service account token' : 'New service account'}
        footer={
          issuedToken ? (
            <ActionButton onClick={() => { setCreateOpen(false); setIssuedToken(null); }}>Done</ActionButton>
          ) : (
            <>
              <ActionButton variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</ActionButton>
              <ActionButton
                disabled={!name.trim() || create.isPending}
                onClick={() => create.mutate(
                  {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    scopes: scopes.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean),
                  },
                  {
                    onSuccess: (result) => {
                      setIssuedToken(result.token);
                      toast.success('Service account created');
                    },
                  },
                )}
              >
                Create
              </ActionButton>
            </>
          )
        }
      >
        {issuedToken ? (
          <TokenReveal>
            <TokenRevealTitle>Copy this token now</TokenRevealTitle>
            <TokenRevealText>It is shown exactly once and cannot be retrieved again.</TokenRevealText>
            <TokenBox>
              <code>{issuedToken}</code>
              <CopyButton value={issuedToken} label="Copy token" />
            </TokenBox>
          </TokenReveal>
        ) : (
          <InviteForm>
            <InviteLabel>
              Name
              <InviteInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ci-pipeline" autoFocus />
            </InviteLabel>
            <InviteLabel>
              Description
              <InviteInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What runs on this account" />
            </InviteLabel>
            <InviteLabel>
              Scopes (space or comma separated)
              <InviteInput value={scopes} onChange={(e) => setScopes(e.target.value)} placeholder="studio:read studio:write" />
            </InviteLabel>
          </InviteForm>
        )}
      </Modal>

      <Modal
        open={!!rotateTarget}
        onClose={() => { setRotateTarget(null); setIssuedToken(null); }}
        title={issuedToken ? 'New service token' : `Rotate token for "${rotateTarget?.name ?? ''}"?`}
        footer={
          issuedToken ? (
            <ActionButton onClick={() => { setRotateTarget(null); setIssuedToken(null); }}>Done</ActionButton>
          ) : (
            <>
              <ActionButton variant="secondary" onClick={() => setRotateTarget(null)}>Cancel</ActionButton>
              <ActionButton
                disabled={rotate.isPending}
                onClick={() => rotateTarget && rotate.mutate(
                  { id: rotateTarget.id },
                  { onSuccess: (result) => { setIssuedToken(result.token); toast.success('Token rotated'); } },
                )}
              >
                Rotate
              </ActionButton>
            </>
          )
        }
      >
        {issuedToken ? (
          <TokenReveal>
            <TokenRevealTitle>Copy this token now</TokenRevealTitle>
            <TokenRevealText>The previous token stopped working the moment this one was issued.</TokenRevealText>
            <TokenBox>
              <code>{issuedToken}</code>
              <CopyButton value={issuedToken} label="Copy token" />
            </TokenBox>
          </TokenReveal>
        ) : (
          <TokenRevealText>
            Rotation issues a new token and invalidates the old one immediately. Services using it must be updated.
          </TokenRevealText>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this service account?"
        message={deleteTarget ? `"${deleteTarget.name}" and its token stop working immediately.` : ''}
        destructive
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            del.mutate(deleteTarget.id, { onSuccess: () => toast.success('Service account deleted') });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

// ─── Invite modal ────────────────────────────────────────────────────
function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('developer');
  const invite = useInviteMember();

  const send = () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Enter a valid email address');
      return;
    }
    invite.mutate(
      { email: trimmed, role },
      { onSuccess: () => { toast.success(`Invite sent to ${trimmed}`); setEmail(''); onClose(); } },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite a member"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton disabled={invite.isPending} onClick={send}>Send invite</ActionButton>
        </>
      }
    >
      <InviteForm>
        <InviteLabel>
          Email address
          <InviteInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            autoFocus
          />
        </InviteLabel>
        <InviteLabel>
          Role
          <RoleSelect value={role} onChange={(e) => setRole(e.target.value as OrgRole)} aria-label="Invite role">
            {INVITE_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </RoleSelect>
        </InviteLabel>
      </InviteForm>
    </Modal>
  );
}

// ─── local styled additions ──────────────────────────────────────────
const IconGhostBtn = styled.button`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 7px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const ServiceActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

const RoleSelect = styled.select`
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

const TokenReveal = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TokenRevealTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

const TokenRevealText = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

const TokenBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid ${({ theme }) => theme.app.border.strong};

  code {
    flex: 1;
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: ${({ theme }) => theme.app.type.caption};
    color: ${({ theme }) => theme.app.text.primary};
    word-break: break-all;
    line-height: 1.5;
  }
`;
