import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Users, Mail, ShieldCheck, KeyRound, Check as CheckIcon, X as XIcon } from 'lucide-react';
import teams from '../../data/teams.json';
import { pageItem } from '@styles/motion';
import {
  InviteBtn,
  SectionTitle,
  KpiGrid,
  KpiCard,
  KpiLabel,
  KpiValue,
  KpiMeta,
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
  TokenTable,
  TokenHead,
  TokenRow,
  MatrixCard,
  MatrixTable,
  MatrixHeaderRow,
  MatrixRole,
  MatrixAction,
  MatrixBody,
  MatrixRow,
  MatrixCell,
  Check,
} from './TeamsView.styles';

const roles: Array<keyof Omit<typeof teams.rbacMatrix[0], 'action'>> = [
  'owner',
  'admin',
  'deployer',
  'developer',
  'viewer',
];

export function TeamsView() {
  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
          <ViewTitle>Teams</ViewTitle>
          <ViewSubtitle>
            Workspace members, RBAC matrix, service accounts, and API tokens for the deployment
            surface.
          </ViewSubtitle>
        <InviteBtn type="button" onClick={() => toast.success('Invite dialog opened')}>
          <Plus size={14} strokeWidth={2} />
          Invite member
        </InviteBtn>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <KpiGrid>
          <KpiCard>
            <KpiLabel>Seats</KpiLabel>
            <KpiValue>{teams.summary.totalSeats}</KpiValue>
            <KpiMeta>Enterprise plan</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Active members</KpiLabel>
            <KpiValue style={{ color: '#34d399' }}>{teams.summary.activeMembers}</KpiValue>
            <KpiMeta>last 30 days</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Pending invites</KpiLabel>
            <KpiValue style={{ color: '#fbbf24' }}>{teams.summary.pendingInvites}</KpiValue>
            <KpiMeta>awaiting accept</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Service accounts</KpiLabel>
            <KpiValue>{teams.summary.serviceAccounts}</KpiValue>
            <KpiMeta>key-based auth</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>API tokens</KpiLabel>
            <KpiValue>{teams.summary.apiTokens}</KpiValue>
            <KpiMeta>long-lived</KpiMeta>
          </KpiCard>
        </KpiGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
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
              variants={pageItem}
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
              <Td>{m.twoFactor ? <TwoFactorBadge>2FA</TwoFactorBadge> : '—'}</Td>
            </TableRow>
          ))}
        </MemberTable>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={12}>
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

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={14}>
        <SectionTitle>
          <ShieldCheck size={14} strokeWidth={1.7} />
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
              custom={i + 15}
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

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={22}>
        <SectionTitle>
          <KeyRound size={14} strokeWidth={1.7} />
          API tokens
        </SectionTitle>
        <TokenTable>
          <TokenHead>
            <Th>Token</Th>
            <Th>Scope</Th>
            <Th>Created</Th>
            <Th>Expires</Th>
            <Th>Last used</Th>
          </TokenHead>
          {teams.apiTokens.map((t, i) => (
            <TokenRow
              key={t.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={pageItem}
              custom={i + 23}
            >
              <Td>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</span>
              </Td>
              <Td>
                <RolePill $tone={t.tone}>{t.scope}</RolePill>
              </Td>
              <Td>{t.createdAt}</Td>
              <Td>{t.expiresAt}</Td>
              <Td>{t.lastUsed}</Td>
            </TokenRow>
          ))}
        </TokenTable>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={26}>
        <SectionTitle>
          <ShieldCheck size={14} strokeWidth={1.7} />
          RBAC matrix
        </SectionTitle>
        <MatrixCard>
          <MatrixTable>
            <MatrixHeaderRow>
              <MatrixAction>Action</MatrixAction>
              {roles.map((r) => (
                <MatrixRole key={r}>{r}</MatrixRole>
              ))}
            </MatrixHeaderRow>
            <MatrixBody>
              {teams.rbacMatrix.map((row) => (
                <MatrixRow key={row.action}>
                  <MatrixAction>{row.action}</MatrixAction>
                  {roles.map((r) => (
                    <MatrixCell key={r}>
                      <Check $on={Boolean(row[r])}>
                        {row[r] ? <CheckIcon size={11} strokeWidth={2.5} /> : <XIcon size={11} strokeWidth={1.5} />}
                      </Check>
                    </MatrixCell>
                  ))}
                </MatrixRow>
              ))}
            </MatrixBody>
          </MatrixTable>
        </MatrixCard>
      </motion.div>
    </ViewShell>
  );
}

