import { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from '@tanstack/react-router';
import { Plus, Users, Mail, Clock, ShieldCheck, RefreshCw, Power, Trash2 } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import { StyledActionButton } from '@components/common/ui/ActionButton/ActionButton.styles';
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
  useResendInvite,
  useRevokeInvite,
  useDeleteGroup,
  useRotateServiceAccountToken,
  useDisableServiceAccount,
  useEnableServiceAccount,
  useDeleteServiceAccount,
} from '@hooks/engine/mutations';
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

export function TeamsView() {
  const { canManageMembers, role } = useOrg();
  const summary = useOrgSummary();
  const members = useMembers();
  // The invites list is owner/admin-only server-side — don't fire a
  // guaranteed-403 query for other roles (same gate as SettingsTeam and
  // OrgMembersPage; P5-T2 follow-through).
  const invites = useInvites({ enabled: canManageMembers });

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
          <ActionButtonLink as={Link} to="/agent-studio/teams/invite" $size="sm" $variant="primary">
            <Plus size={14} strokeWidth={2} />
            Invite member
          </ActionButtonLink>
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
          {/* P5-T4: every org has an owner — the roster is never empty. */}
          <QueryView query={members} skeleton={<Skeleton $h="240px" $r="12px" />}>
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

      {/* The section is manager-gated: the invites list is owner/admin-only
          server-side, so for other roles the query stays disabled and this
          section never renders (P5-T2 follow-through). */}
      {canManageMembers &&
        (invites.data?.invites.filter((i) => i.status === 'pending' || i.status === 'expired').length ?? 0) > 0 && (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={14}>
          <SectionTitle>
            <Mail size={14} strokeWidth={1.7} />
            Pending invites
          </SectionTitle>
          <PendingInvitesCard />
        </motion.div>
      )}

      {/* Team-loop §4: every role reads the inventory (groups readable by all
          roles server-side; service accounts by all-but-reader). Mutating
          buttons stay owner/admin-gated inside each section. */}
      <GroupsSection />

      {role !== 'reader' && <ServiceAccountsSection />}
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

// ─── Pending invites (owner/admin only, server-side; the query stays ──────
// disabled for other roles so no guaranteed-403 fires — P5-T2 follow-through)
function PendingInvitesCard() {
  const { canManageMembers } = useOrg();
  const invites = useInvites({ enabled: canManageMembers });
  const resend = useResendInvite();
  const revoke = useRevokeInvite();
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; email: string } | null>(null);
  const [resendTarget, setResendTarget] = useState<{ id: string; email: string } | null>(null);
  // Rotation-only re-access (team-loop §1B): Copy is never re-offered on a
  // stored row — a manual resend rotates and shows the new link once here.
  const [rotated, setRotated] = useState<{ email: string; accept_url: string } | null>(null);
  // P5-T5: expired invites stay actionable — resend revives them server-side.
  const pending = (invites.data?.invites ?? []).filter((i) => i.status === 'pending' || i.status === 'expired');

  return (
    <>
      {rotated && (
        <PendingCard>
          <PendingRow>
            <div>
              <PendingEmail>New link for {rotated.email} (shown once)</PendingEmail>
              <PendingMeta>Previous link died on rotation. Copy is not re-offered — resend again to rotate.</PendingMeta>
            </div>
            <PendingActions>
              <CopyButton value={rotated.accept_url} label="Copy link" />
              <ActionButton variant="secondary" size="sm" onClick={() => setRotated(null)}>
                Done
              </ActionButton>
            </PendingActions>
          </PendingRow>
        </PendingCard>
      )}
      <PendingCard>
        {pending.map((p) => (
          <PendingRow key={p.id}>
            <div>
              <PendingEmail>{p.email}{p.status === 'expired' && ' · expired'}</PendingEmail>
              <PendingMeta>
                {p.role} · expires {shortDate(p.expiresAt)}
              </PendingMeta>
            </div>
            <PendingActions>
              {/* P5-T2: this card only renders when the invite list loads, which
                  is owner/admin-only server-side — the non-manager fallback was
                  unreachable. Actions render unconditionally here. */}
              <ActionButton
                size="sm"
                disabled={resend.isPending}
                title="Rotate the token and re-email the fresh link"
                onClick={() => setResendTarget({ id: p.id, email: p.email })}
              >
                Resend
              </ActionButton>
              <ActionButton
                variant="secondary"
                size="sm"
                disabled={resend.isPending}
                title="Rotate the token and show the new link once"
                onClick={() =>
                  resend.mutate(
                    { inviteId: p.id, delivery: 'manual' },
                    {
                      onSuccess: (result) => {
                        if (result.accept_url) {
                          setRotated({ email: p.email, accept_url: result.accept_url });
                        } else {
                          toast.success(`Invite re-sent to ${p.email}`);
                        }
                      },
                    },
                  )
                }
              >
                Link
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
        open={!!resendTarget}
        title="Resend this invite?"
        message={resendTarget ? `A fresh link goes to ${resendTarget.email}. The previous link stops working immediately.` : ''}
        confirmLabel="Resend invite"
        onConfirm={() => {
          if (resendTarget) {
            resend.mutate({ inviteId: resendTarget.id, delivery: 'email' }, { onSuccess: () => toast.success(`Invite re-sent to ${resendTarget.email}`) });
          }
          setResendTarget(null);
        }}
        onCancel={() => setResendTarget(null)}
      />

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

// ─── Groups (readable by every role; create/delete owner/admin only) ────
function GroupsSection() {
  const { canManageMembers } = useOrg();
  const groups = useGroups();
  const remove = useDeleteGroup();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={15}>
        <SectionTitle>
          <ShieldCheck size={14} strokeWidth={1.7} />
          Groups
          {canManageMembers && (
            <ActionButtonLink as={Link} to="/agent-studio/teams/groups/new" $size="sm" $variant="secondary">
              <Plus size={13} strokeWidth={2} />
              New group
            </ActionButtonLink>
          )}
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
                    {canManageMembers && (
                      <IconGhostBtn type="button" aria-label={`Delete group ${g.name}`} title="Delete group" onClick={() => setDeleteTarget({ id: g.id, name: g.name })}>
                        <Trash2 size={13} strokeWidth={1.7} />
                      </IconGhostBtn>
                    )}
                  </GroupBottom>
                </GroupCard>
              ))}
            </GroupGrid>
          )}
        </QueryView>
      </motion.div>

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

// ─── Service accounts (readable by all-but-reader; all writes owner/admin) ─
function ServiceAccountsSection() {
  const { canManageMembers } = useOrg();
  const accounts = useServiceAccounts();
  const rotate = useRotateServiceAccountToken();
  const disable = useDisableServiceAccount();
  const enable = useEnableServiceAccount();
  const del = useDeleteServiceAccount();

  // Shown-once restore, computed lazily at mount (not in an effect): a
  // rotated token that was revealed but never acknowledged (e.g. refresh
  // mid-reveal) reopens the panel in the explicit "already revealed" state
  // instead of silently losing the token — the same sessionStorage marker
  // pattern the create route uses.
  const [rotateRestore] = useState<{ id: string; name: string } | null>(() => {
    try {
      const prefix = 'teams:service-account:rotate:revealed:';
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          return { id: key.slice(prefix.length), name: sessionStorage.getItem(key) || 'service account' };
        }
      }
    } catch {
      // Storage blocked — nothing to restore.
    }
    return null;
  });
  const [rotateTarget, setRotateTarget] = useState<{ id: string; name: string } | null>(rotateRestore);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [rotateAlreadyRevealed, setRotateAlreadyRevealed] = useState<boolean>(rotateRestore !== null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={21}>
        <SectionTitle>
          <Clock size={14} strokeWidth={1.7} />
          Service accounts
          {canManageMembers && (
            <ActionButtonLink as={Link} to="/agent-studio/teams/service-accounts/new" $size="sm" $variant="secondary">
              <Plus size={13} strokeWidth={2} />
              New service account
            </ActionButtonLink>
          )}
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
                  {canManageMembers && (
                    <ServiceActions>
                      <IconGhostBtn
                        type="button"
                        aria-label={`Rotate token for ${s.name}`}
                        title="Rotate token"
                        disabled={rotate.isPending}
                        onClick={() => { setRotateTarget({ id: s.id, name: s.name }); setIssuedToken(null); setRotateAlreadyRevealed(false); }}
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
                  )}
                </ServiceCard>
              ))}
            </ServiceGrid>
          )}
        </QueryView>
      </motion.div>

      {/* Rotate token — inline section (not a modal). Two phases: confirm →
          token reveal. The token is shown exactly once. */}
      {rotateTarget && (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={30}>
          <Panel>
            {issuedToken ? (
              <TokenReveal>
                <TokenRevealTitle>Copy this token now</TokenRevealTitle>
                <TokenRevealText>The previous token stopped working the moment this one was issued.</TokenRevealText>
                <TokenBox>
                  <code>{issuedToken}</code>
                  <CopyButton value={issuedToken} label="Copy token" />
                </TokenBox>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <ActionButton onClick={() => { try { sessionStorage.removeItem(`teams:service-account:rotate:revealed:${rotateTarget.id}`); } catch { /* storage blocked */ } setRotateTarget(null); setIssuedToken(null); }}>Done</ActionButton>
                </div>
              </TokenReveal>
            ) : rotateAlreadyRevealed ? (
              <>
                <TokenRevealTitle>Token already shown</TokenRevealTitle>
                <TokenRevealText>
                  A rotated token for &ldquo;{rotateTarget.name}&rdquo; was already generated and shown once.
                  It cannot be displayed again — rotating again issues a fresh token and invalidates the old one.
                </TokenRevealText>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <ActionButton variant="secondary" onClick={() => { try { sessionStorage.removeItem(`teams:service-account:rotate:revealed:${rotateTarget.id}`); } catch { /* storage blocked */ } setRotateTarget(null); setRotateAlreadyRevealed(false); }}>Dismiss</ActionButton>
                  <ActionButton onClick={() => setRotateAlreadyRevealed(false)}>
                    Rotate again
                  </ActionButton>
                </div>
              </>
            ) : (
              <>
                <TokenRevealTitle>Rotate token for &ldquo;{rotateTarget.name}&rdquo;?</TokenRevealTitle>
                <TokenRevealText>
                  Rotation issues a new token and invalidates the old one immediately. Services using it must be updated.
                </TokenRevealText>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <ActionButton variant="secondary" onClick={() => { setRotateTarget(null); setRotateAlreadyRevealed(false); }}>Cancel</ActionButton>
                  <ActionButton
                    disabled={rotate.isPending}
                    onClick={() => rotate.mutate(
                      { id: rotateTarget.id },
                      { onSuccess: (result) => { setIssuedToken(result.token); try { sessionStorage.setItem(`teams:service-account:rotate:revealed:${rotateTarget.id}`, rotateTarget.name); } catch { /* storage blocked — in-memory reveal still renders once */ } toast.success('Token rotated'); } },
                    )}
                  >
                    Rotate
                  </ActionButton>
                </div>
              </>
            )}
          </Panel>
        </motion.div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this service account?"
        message={deleteTarget ? `"${deleteTarget.name}" and its token stop working immediately.` : ''}
        destructive
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            // Success + error copy both live in the hook (incl. step-up
            // retry for the engine's fresh-proof demand) — no caller toast,
            // or the same sentence reports twice.
            del.mutate({ id: deleteTarget.id });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

// ─── local styled additions ──────────────────────────────────────────

/**
 * Router link with the ActionButton look — list → section navigation.
 * ActionButton itself is button-only (no `as` polymorphism), so the styled
 * base is reused here; the anchor underline is removed and the polymorphic
 * `as` prop is supplied at each call site (`as={Link}`).
 */
const ActionButtonLink = styled(StyledActionButton)`
  text-decoration: none;
`;
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
