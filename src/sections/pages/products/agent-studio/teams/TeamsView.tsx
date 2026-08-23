import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Users, Mail, Clock, ShieldCheck } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Segmented } from '@components/common/ui/Segmented';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle, SectionTitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import teams from '@neryva_data/products/agent_studio/teams.json';
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

type InviteRole = 'Admin' | 'Editor' | 'Viewer';
const roleOptions: { value: InviteRole; label: string }[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Viewer', label: 'Viewer' },
];

const toneToStatus: Record<string, StatusTone> = {
  lilac: 'lilac',
  azure: 'azure',
  emerald: 'emerald',
  amber: 'warning',
};

export function TeamsView() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('Editor');

  const sendInvite = () => {
    const email = inviteEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    toast.success(`Invite sent to ${email} as ${inviteRole}`);
    setInviteEmail('');
    setInviteRole('Editor');
    setInviteOpen(false);
  };

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Teams</ViewTitle>
          <ViewSubtitle>
            Manage workspace members, invitations, service accounts, and access groups.
          </ViewSubtitle>
        </ViewHeader>
        <ActionButton size="sm" onClick={() => setInviteOpen(true)}>
          <Plus size={14} strokeWidth={2} />
          Invite member
        </ActionButton>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <TotalsGrid>
          <TotalCard>
            <TotalLabel>Seats</TotalLabel>
            <TotalValue>{teams.summary.totalSeats}</TotalValue>
            <TotalMeta>Scale plan</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Active members</TotalLabel>
            <TotalValue $tone="success">{teams.summary.activeMembers}</TotalValue>
            <TotalMeta>last 30 days</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Pending invites</TotalLabel>
            <TotalValue $tone="warning">{teams.summary.pendingInvites}</TotalValue>
            <TotalMeta>awaiting accept</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Service accounts</TotalLabel>
            <TotalValue>{teams.summary.serviceAccounts}</TotalValue>
            <TotalMeta>API-key based</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Groups</TotalLabel>
            <TotalValue>{teams.summary.groupsCount}</TotalValue>
            <TotalMeta>RBAC containers</TotalMeta>
          </TotalCard>
        </TotalsGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionTitle>
          <Users size={14} strokeWidth={1.7} />
          Members
        </SectionTitle>
        <Panel flush>
          <DataTable>
            <DataHead>
              <DataCell $w="36%">Member</DataCell>
              <DataCell $w="16%">Role</DataCell>
              <DataCell $w="18%">Last active</DataCell>
              <DataCell $w="18%">Joined</DataCell>
              <DataCell $w="12%">2FA</DataCell>
            </DataHead>
            {teams.members.map((m, i) => (
              <DataRow
                key={m.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i + 3}
                $interactive={false}
              >
                <DataCell $w="36%">
                  <MemberCell>
                    <Avatar $tone={m.tone}>{m.avatarInitials}</Avatar>
                    <MemberInfo>
                      <MemberName>{m.name}</MemberName>
                      <MemberEmail>{m.email}</MemberEmail>
                    </MemberInfo>
                  </MemberCell>
                </DataCell>
                <DataCell $w="16%">
                  <StatusPill tone={toneToStatus[m.tone] ?? 'neutral'} dot={false}>
                    {m.role}
                  </StatusPill>
                </DataCell>
                <DataCell $w="18%">
                  <MemberEmail as="div">{m.lastActive}</MemberEmail>
                </DataCell>
                <DataCell $w="18%">
                  <MemberEmail as="div">{m.joined}</MemberEmail>
                </DataCell>
                <DataCell $w="12%">
                  {m.twoFactor ? (
                    <StatusPill tone="success" dot={false}>2FA</StatusPill>
                  ) : (
                    <MemberEmail as="div">—</MemberEmail>
                  )}
                </DataCell>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={14}>
        <SectionTitle>
          <Mail size={14} strokeWidth={1.7} />
          Pending invites
        </SectionTitle>
        <PendingCard>
          {teams.pending.map((p) => (
            <PendingRow key={p.id}>
              <div>
                <PendingEmail>{p.email}</PendingEmail>
                <PendingMeta>
                  invited by {p.invitedBy} · {p.invitedAt} · expires {p.expiresAt}
                </PendingMeta>
              </div>
              <PendingActions>
                <StatusPill tone={toneToStatus[p.tone] ?? 'neutral'} dot={false}>
                  {p.role}
                </StatusPill>
                <ActionButton
                  size="sm"
                  onClick={() => toast.success(`Invite to ${p.email} resent`)}
                >
                  Resend
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.success(`Invite to ${p.email} revoked`)}
                >
                  Revoke
                </ActionButton>
              </PendingActions>
            </PendingRow>
          ))}
        </PendingCard>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={15}>
        <SectionTitle>
          <ShieldCheck size={14} strokeWidth={1.7} />
          Groups
        </SectionTitle>
        <GroupGrid>
          {teams.groups.map((g, i) => (
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
                <StatusPill tone={toneToStatus[g.tone] ?? 'neutral'} dot={false}>
                  {g.permission}
                </StatusPill>
              </GroupTop>
              <GroupDesc>{g.description}</GroupDesc>
              <GroupBottom>
                <GroupMembers>{g.members} members</GroupMembers>
              </GroupBottom>
            </GroupCard>
          ))}
        </GroupGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={21}>
        <SectionTitle>
          <Clock size={14} strokeWidth={1.7} />
          Service accounts
        </SectionTitle>
        <ServiceGrid>
          {teams.serviceAccounts.map((s, i) => (
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
                  <ServiceOwner>{s.owner}</ServiceOwner>
                </div>
                <StatusPill tone="lilac" dot={false}>service</StatusPill>
              </ServiceTop>
              <ServiceMeta>
                <MetaItem>
                  <MetaLabel>Last used</MetaLabel>
                  <MetaValue>{s.lastUsed}</MetaValue>
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
            </ServiceCard>
          ))}
        </ServiceGrid>
      </motion.div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a member"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton onClick={sendInvite}>Send invite</ActionButton>
          </>
        }
      >
        <InviteForm>
          <InviteLabel>
            Email address
            <InviteInput
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.com"
              autoFocus
            />
          </InviteLabel>
          <InviteLabel>
            Role
            <Segmented
              options={roleOptions}
              value={inviteRole}
              onChange={setInviteRole}
              size="md"
              ariaLabel="Invite role"
            />
          </InviteLabel>
        </InviteForm>
      </Modal>
    </ViewShell>
  );
}
