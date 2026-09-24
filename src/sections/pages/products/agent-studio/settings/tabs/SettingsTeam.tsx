import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, ChevronDown, Check, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { Avatar } from '@components/common/ui/Avatar';
import { StatusPill } from '@components/common/ui/StatusPill';
import { TextInput } from '@components/common/ui/TextInput';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { spring } from '@styles/motion';
import { useMembers, useInvites } from '@hooks/engine/queries';
import type {
  MemberRow, InviteRow } from '@hooks/engine/queries';
import { useInviteMember, useResendInvite, useRevokeInvite, useChangeRole, useSuspendMember, useReactivateMember, useRemoveMember } from '@hooks/engine/mutations';
import { useOrg } from '@/Context/OrgContext';
import type { OrgRole } from '@/Context/OrgContext';
import { ApiError } from '@lib/engine/client';

/**
 * Settings → Team (ledger T-5)
 *
 * Live org membership through the engine: role changes (step-up-protected,
 * auto-retried on expired proofs), suspend/reactivate/remove, invites with
 * resend/revoke. Mutations are immediate — there is no save button to fake.
 *
 * Apple-grade behaviors kept from the redesign: role cell is a popover
 * picker with a checkmark on the current role, soft-disabled invite button,
 * spring menus, layout-animated rows.
 */

const ROLES: OrgRole[] = ['owner', 'admin', 'billing', 'developer', 'reader'];

const ROLE_LABELS_CAP: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  billing: 'Billing',
  developer: 'Developer',
  reader: 'Reader',
};

const ROLE_HUES: Record<OrgRole, 'azure' | 'emerald' | 'lilac' | 'amethyst'> = {
  owner: 'amethyst',
  admin: 'azure',
  billing: 'emerald',
  developer: 'lilac',
  reader: 'azure',
};

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 } }),
};

export function SettingsTeam() {
  const { canManageMembers } = useOrg();
  const members = useMembers();
  const invites = useInvites();

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <Panel title="Members" subtitle="People with access to this workspace.">
          {canManageMembers && <InviteForm />}
          <QueryView query={members} skeleton={<Skeleton $h="260px" $r="12px" />} isEmpty={(d) => d.members.length === 0} empty={{ title: 'No members yet', description: 'Invite teammates to collaborate on agents and conversations.' }}>
            {(data) => <MembersTable members={data.members} canManage={canManageMembers} />}
          </QueryView>
        </Panel>
      </motion.div>

      {canManageMembers && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
          <PendingInvites invites={invites.data?.invites ?? []} />
        </motion.div>
      )}
    </>
  );
}

function InviteForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('developer');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const invite = useInviteMember();

  const send = () => {
    if (!email.includes('@')) {
      toast.error('Enter a valid email');
      return;
    }
    setInviteError(null);
    invite.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => { toast.success(`Invite sent to ${email.trim()}`); setEmail(''); },
        // useInviteMember is silentError (OrgMembersPage renders inline copy instead
        // of a toast) — this form must surface failures inline too, otherwise a
        // failed invite dies with no feedback at all (P5-T1).
        onError: (error) => {
          setInviteError(error instanceof ApiError ? error.message : 'Could not send the invitation — try again.');
        },
      },
    );
  };

  return (
    <>
    <InviteWrap>
      <div style={{ flex: 1 }}>
        <TextInput
          placeholder="email@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && email.includes('@')) send();
          }}
          aria-label="Email address"
        />
      </div>
      <RoleSelect aria-label="Invite role" value={role} onChange={(e) => setRole(e.target.value as OrgRole)}>
        {ROLES.filter((r) => r !== 'owner').map((r) => (
          <option key={r} value={r}>{ROLE_LABELS_CAP[r]}</option>
        ))}
      </RoleSelect>
      <InviteBtn
        type="button"
        onClick={send}
        disabled={!email.includes('@') || invite.isPending}
        whileTap={email.includes('@') ? { scale: 0.97 } : undefined}
        transition={spring.snap}
      >
        <Plus size={13} strokeWidth={2} />
        Send invite
      </InviteBtn>
    </InviteWrap>
    {inviteError && <InviteError role="alert">{inviteError}</InviteError>}
    </>
  );
}

function MembersTable({ members, canManage }: { members: MemberRow[]; canManage: boolean }) {
  return (
    <TableWrap>
      <TableHeader>
        <div style={{ width: '34%' }}>Member</div>
        <div style={{ width: '24%' }}>Role</div>
        <div style={{ width: '16%' }}>Status</div>
        <div style={{ width: '18%' }}>Last active</div>
        <div style={{ width: '44px' }} />
      </TableHeader>
      {members.map((m, i) => {
        const displayName = m.displayName ?? m.email;
        const initials = displayName.split(' ').map((s) => s[0]).slice(0, 2).join('');
        const role = m.role as OrgRole;
        const hue = ROLE_HUES[role] ?? 'azure';
        return (
          <MemberTableRow      key={m.accountId}
            as={motion.div}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.spring, delay: i * 0.03 }}
          >
            <MemberCell>
              <Avatar initials={initials} hue={hue} size={32} status={m.status === 'active' ? 'online' : 'idle'} />
              <MemberInfo>
                <MemberName>{displayName}</MemberName>
                <MemberEmail>{m.email}</MemberEmail>
              </MemberInfo>
            </MemberCell>
            <div style={{ width: '24%' }}>
              {canManage && role !== 'owner' ? (
                <RoleMenu current={role} accountId={m.accountId} name={displayName} />
              ) : (
                <RoleStatic><RoleDot $hue={hue} aria-hidden="true" />{ROLE_LABELS_CAP[role] ?? role}</RoleStatic>
              )}
            </div>
            <div style={{ width: '16%' }}>
              <StatusPill tone={m.status === 'active' ? 'success' : 'warning'} dot>
                {m.status}
              </StatusPill>
            </div>
            <MemberLastActive>{m.lastActiveAt ? relativeDay(m.lastActiveAt) : `Joined ${relativeDay(m.memberSince)}`}</MemberLastActive>
            <div style={{ width: '44px', display: 'flex', justifyContent: 'flex-end' }}>
              <MemberMore member={m} canManage={canManage} />
            </div>
          </MemberTableRow>
        );
      })}
    </TableWrap>
  );
}

function relativeDay(iso: string): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) {
    return iso;
  }
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ─── RoleMenu — popover picker wired to the engine ───────────────────
function RoleMenu({ current, accountId, name }: { current: OrgRole; accountId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const changeRole = useChangeRole();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <Wrap ref={wrapRef}>
      <RoleButton
        type="button"
        onClick={() => setOpen((o) => !o)}
        $open={open}
        whileTap={{ scale: 0.97 }}
        transition={spring.snap}
      >
        <RoleDot $hue={ROLE_HUES[current]} aria-hidden="true" />
        {ROLE_LABELS_CAP[current] ?? current}
        <ChevronDown size={11} strokeWidth={2} />
      </RoleButton>
      <AnimatePresence>
        {open && (
          <Menu
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={spring.gentle}
            role="menu"
          >
            {ROLES.map((r) => (
              <MenuItem
                key={r}
                type="button"
                role="menuitemradio"
                aria-checked={current === r}
                disabled={changeRole.isPending}
                onClick={() => {
                  if (r === current) {
                    setOpen(false);
                    return;
                  }
                  changeRole.mutate(
                    { accountId, role: r },
                    { onSuccess: () => { toast.success(`${name} is now ${ROLE_LABELS_CAP[r]}`); setOpen(false); } },
                  );
                }}
                whileTap={{ scale: 0.985 }}
                transition={spring.snap}
              >
                <RoleDot $hue={ROLE_HUES[r]} aria-hidden="true" />
                <MenuLabel>{ROLE_LABELS_CAP[r]}</MenuLabel>
                {current === r && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={spring.bouncy}
                    className="role-check"
                  >
                    <Check size={13} strokeWidth={2.2} />
                  </motion.span>
                )}
              </MenuItem>
            ))}
          </Menu>
        )}
      </AnimatePresence>
    </Wrap>
  );
}

// ─── MemberMore — real secondary actions ─────────────────────────────
function MemberMore({ member, canManage }: { member: MemberRow; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const suspend = useSuspendMember();
  const reactivate = useReactivateMember();
  const remove = useRemoveMember();
  const role = member.role as OrgRole;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!canManage || role === 'owner') {
    return null;
  }

  return (
    <Wrap ref={wrapRef}>
      <MoreBtn type="button" aria-label={`Actions for ${member.displayName ?? member.email}`} onClick={() => setOpen((o) => !o)} $open={open}>
        <MoreHorizontal size={15} strokeWidth={1.7} />
      </MoreBtn>
      <AnimatePresence>
        {open && (
          <Menu
            $align="right"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={spring.gentle}
            role="menu"
          >
            <MenuItem
              type="button"
              role="menuitem"
              onClick={() => {
                void navigator.clipboard.writeText(member.email);
                toast.success(`Copied ${member.email}`);
                setOpen(false);
              }}
              whileTap={{ scale: 0.985 }}
              transition={spring.snap}
            >
              <MenuLabel>Copy email</MenuLabel>
            </MenuItem>
            {member.status === 'active' ? (
              <MenuItem
                type="button"
                role="menuitem"
                disabled={suspend.isPending}
                onClick={() => {
                  suspend.mutate(
                    { accountId: member.accountId },
                    { onSuccess: () => { toast.success('Member suspended'); setOpen(false); } },
                  );
                }}
                whileTap={{ scale: 0.985 }}
                transition={spring.snap}
              >
                <MenuLabel>Suspend access</MenuLabel>
              </MenuItem>
            ) : (
              <MenuItem
                type="button"
                role="menuitem"
                disabled={reactivate.isPending}
                onClick={() => {
                  reactivate.mutate(
                    { accountId: member.accountId },
                    { onSuccess: () => { toast.success('Member reactivated'); setOpen(false); } },
                  );
                }}
                whileTap={{ scale: 0.985 }}
                transition={spring.snap}
              >
                <MenuLabel>Reactivate access</MenuLabel>
              </MenuItem>
            )}
            <MenuItem
              $danger
              type="button"
              role="menuitem"
              disabled={remove.isPending}
              onClick={() => {
                setOpen(false);
                setConfirmRemove(true);
              }}
              whileTap={{ scale: 0.985 }}
              transition={spring.snap}
            >
              <MenuLabel>Remove member</MenuLabel>
            </MenuItem>
          </Menu>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmRemove}
        title="Remove this member?"
        message={`${member.displayName ?? member.email} loses access to this workspace immediately. Their account is not deleted.`}
        destructive
        confirmLabel="Remove"
        onConfirm={() => {
          remove.mutate(
            { accountId: member.accountId },
            { onSuccess: () => toast.success('Member removed') },
          );
          setConfirmRemove(false);
        }}
        onCancel={() => setConfirmRemove(false)}
      />
    </Wrap>
  );
}

// ─── Pending invites ─────────────────────────────────────────────────
function PendingInvites({ invites }: { invites: InviteRow[] }) {
  const pending = invites.filter((i) => i.status === 'pending');
  const resend = useResendInvite();
  const revoke = useRevokeInvite();
  const [revokeTarget, setRevokeTarget] = useState<InviteRow | null>(null);

  if (pending.length === 0) {
    return null;
  }

  return (
    <Panel title="Pending invites" subtitle={`${pending.length} awaiting acceptance.`} flush>
      <InviteList>
        {pending.map((invite) => (
          <InviteItemRow key={invite.id}>
            <InviteIcon aria-hidden="true"><Mail size={14} strokeWidth={1.7} /></InviteIcon>
            <InviteInfo>
              <InviteEmail>{invite.email}</InviteEmail>
              <InviteMeta>
                {ROLE_LABELS_CAP[invite.role as OrgRole] ?? invite.role} · expires {relativeDay(invite.expiresAt)}
              </InviteMeta>
            </InviteInfo>
            <InviteActions>
              <MenuTextButton
                type="button"
                disabled={resend.isPending}
                onClick={() => resend.mutate({ inviteId: invite.id }, { onSuccess: () => toast.success('Invite re-sent') })}
              >
                Resend
              </MenuTextButton>
              <MenuTextButton
                type="button"
                $danger
                disabled={revoke.isPending}
                onClick={() => setRevokeTarget(invite)}
              >
                Revoke
              </MenuTextButton>
            </InviteActions>
          </InviteItemRow>
        ))}
      </InviteList>

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
    </Panel>
  );
}

// ─── styled ──────────────────────────────────────────────────────────
const MemberCell = styled.div`
  width: 34%;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const MemberInfo = styled.div`
  min-width: 0;
`;

const MemberName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MemberEmail = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MemberLastActive = styled.div`
  width: 18%;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

const InviteWrap = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  margin-bottom: 16px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const InviteError = styled.div`
  color: ${({ theme }) => theme.app.status.error.fg};
  font-size: ${({ theme }) => theme.app.type.small};
  margin: -8px 0 16px;
`;

const RoleSelect = styled.select`
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 9px;
  padding: 8px 10px;
  height: 36px;
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

const InviteBtn = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  height: 36px;
  border: 0;
  border-radius: 9px;
  background: ${({ theme }) => theme.colors.gradients.primary};
  color: #fff;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 14px ${({ theme }) => theme.app.status.azure.border};
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.muted};
    box-shadow: none;
  }
`;

const TableWrap = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 -22px -22px;
`;

const TableHeader = styled.div`
  display: flex;
  padding: 10px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

const MemberTableRow = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 12px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: ${({ theme }) => theme.app.surface.subtle};
  }
`;

const RoleStatic = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  padding: 5px 0;
`;

const Wrap = styled.div`
  position: relative;
  display: inline-block;
`;

const RoleButton = styled(motion.button)<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 8px;
  border-radius: 8px;
  border: 1px solid ${({ $open }) => ($open ? 'rgba(192, 132, 252, 0.45)' : 'rgba(255, 255, 255, 0.08)')};
  background: ${({ $open }) =>
    $open
      ? 'linear-gradient(180deg, rgba(192, 132, 252, 0.08), rgba(37,99,235,0.04))'
      : 'rgba(255, 255, 255, 0.03)'};
  color: ${({ theme }) => theme.app.text.primary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  svg {
    color: ${({ theme }) => theme.app.text.muted};
    transition: transform ${({ theme }) => theme.transitions.fast};
  }

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    border-color: ${({ theme }) => theme.app.border.hover};
  }
`;

const RoleDot = styled.span<{ $hue: 'azure' | 'emerald' | 'lilac' | 'amethyst' }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $hue }) =>
    $hue === 'emerald'
      ? '#34d399'
      : $hue === 'lilac'
        ? '#c084fc'
        : $hue === 'amethyst'
          ? '#a855f7'
          : '#60a5fa'};
  box-shadow: 0 0 0 2px ${({ $hue }) =>
    $hue === 'emerald'
      ? 'rgba(52, 211, 153, 0.20)'
      : $hue === 'lilac'
        ? 'rgba(192, 132, 252, 0.20)'
        : $hue === 'amethyst'
          ? 'rgba(168, 85, 247, 0.20)'
          : 'rgba(96, 165, 250, 0.20)'};
  flex-shrink: 0;
`;

const Menu = styled(motion.div)<{ $align?: 'right' }>`
  position: absolute;
  top: calc(100% + 6px);
  ${({ $align }) => ($align === 'right' ? 'right: 0;' : 'left: 0;')}
  z-index: 80;
  min-width: 200px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(15, 17, 22, 0.96);
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  transform-origin: top ${({ $align }) => ($align === 'right' ? 'right' : 'left')};
`;

const MenuItem = styled(motion.button)<{ $danger?: boolean }>`
  .role-check {
    display: inline-flex;
    color: ${({ theme }) => theme.app.status.success.fg};
  }

  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;
  text-align: left;
  color: ${({ $danger }) => ($danger ? '#f87171' : '#f5f7fb')};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const MenuLabel = styled.span`
  flex: 1;
`;

const MoreBtn = styled(motion.button)<{ $open: boolean }>`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: ${({ $open }) => ($open ? 'rgba(255, 255, 255, 0.06)' : 'transparent')};
  color: ${({ theme }) => theme.app.text.muted};
  border-radius: 7px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const InviteList = styled.div`
  & > * + * {
    border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
  }
`;

const InviteItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 22px;
`;

const InviteIcon = styled.span`
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.secondary};
  flex-shrink: 0;
`;

const InviteInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const InviteEmail = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const InviteMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 1px;
`;

const InviteActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const MenuTextButton = styled.button<{ $danger?: boolean }>`
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 7px;
  background: transparent;
  color: ${({ $danger, theme }) => ($danger ? theme.app.status.error.fg : theme.app.text.secondary)};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  padding: 5px 10px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &:hover {
    background: ${({ $danger, theme }) => ($danger ? theme.app.status.error.bg : theme.app.surface.active)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;
