import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Users, Mail, Clock, ShieldCheck } from 'lucide-react';
import teams from '@neryva_data/products/agent_studio/teams.json';
import {
  PageRoot,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  InviteBtn,
  TotalsGrid,
  TotalCard,
  TotalLabel,
  TotalValue,
  TotalMeta,
  SectionTitle,
  MemberTable,
  TableHeader,
  TableRow,
  Th,
  Td,
  MemberCell,
  Avatar,
  MemberInfo,
  MemberName,
  MemberEmail,
  TwoFactorBadge,
  RolePill,
  PendingCard,
  PendingRow,
  PendingEmail,
  PendingMeta,
  PendingActions,
  MiniBtn,
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
} from './TeamsView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 },
  }),
};

export function TeamsView() {
  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Teams</PageTitle>
          <PageSubtitle>
            Manage workspace members, invitations, service accounts, and access groups.
          </PageSubtitle>
        </TitleBlock>
        <InviteBtn type="button" onClick={() => toast.success('Invite dialog opened')}>
          <Plus size={14} strokeWidth={2} />
          Invite member
        </InviteBtn>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <TotalsGrid>
          <TotalCard>
            <TotalLabel>Seats</TotalLabel>
            <TotalValue>{teams.summary.totalSeats}</TotalValue>
            <TotalMeta>Scale plan</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Active members</TotalLabel>
            <TotalValue style={{ color: '#34d399' }}>{teams.summary.activeMembers}</TotalValue>
            <TotalMeta>last 30 days</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Pending invites</TotalLabel>
            <TotalValue style={{ color: '#fbbf24' }}>{teams.summary.pendingInvites}</TotalValue>
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

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <SectionTitle>
          <Users size={14} strokeWidth={1.7} />
          Members
        </SectionTitle>
        <MemberTable>
          <TableHeader>
            <Th>Member</Th>
            <Th>Role</Th>
            <Th>Last active</Th>
            <Th>Joined</Th>
            <Th>2FA</Th>
          </TableHeader>
          {teams.members.map((m, i) => (
            <TableRow
              key={m.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 3}
            >
              <Td>
                <MemberCell>
                  <Avatar $tone={m.tone}>{m.avatarInitials}</Avatar>
                  <MemberInfo>
                    <MemberName>{m.name}</MemberName>
                    <MemberEmail>{m.email}</MemberEmail>
                  </MemberInfo>
                </MemberCell>
              </Td>
              <Td>
                <RolePill $tone={m.tone}>{m.role}</RolePill>
              </Td>
              <Td>{m.lastActive}</Td>
              <Td>{m.joined}</Td>
              <Td>
                {m.twoFactor ? <TwoFactorBadge>2FA</TwoFactorBadge> : '—'}
              </Td>
            </TableRow>
          ))}
        </MemberTable>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={14}>
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
                <RolePill $tone={p.tone}>{p.role}</RolePill>
                <MiniBtn
                  type="button"
                  $variant="primary"
                  onClick={() => toast.success(`Invite to ${p.email} resent`)}
                >
                  Resend
                </MiniBtn>
                <MiniBtn
                  type="button"
                  onClick={() => toast.success(`Invite to ${p.email} revoked`)}
                >
                  Revoke
                </MiniBtn>
              </PendingActions>
            </PendingRow>
          ))}
        </PendingCard>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={15}>
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
              variants={fadeUp}
              custom={i + 16}
            >
              <GroupTop>
                <GroupName>{g.name}</GroupName>
                <RolePill $tone={g.tone}>{g.permission}</RolePill>
              </GroupTop>
              <GroupDesc>{g.description}</GroupDesc>
              <GroupBottom>
                <GroupMembers>{g.members} members</GroupMembers>
              </GroupBottom>
            </GroupCard>
          ))}
        </GroupGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={21}>
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
              variants={fadeUp}
              custom={i + 22}
            >
              <ServiceTop>
                <div>
                  <ServiceName>{s.name}</ServiceName>
                  <ServiceOwner>{s.owner}</ServiceOwner>
                </div>
                <RolePill $tone={s.tone}>service</RolePill>
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
    </PageRoot>
  );
}
