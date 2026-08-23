import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { Avatar } from '@components/common/ui/Avatar';
import { StatusPill } from '@components/common/ui/StatusPill';
import { TextInput } from '@components/common/ui/TextInput';
import { spring } from '@styles/motion';
import settings from '@neryva_data/products/agent_studio/settings.json';
import { SaveRow } from './shared';

/**
 * Settings → Team
 *
 * Apple-grade behaviors:
 * - Role cell is a real popover trigger. Click opens a frosted-glass
 *   menu below it with a checkmark on the current role. Click outside
 *   or press Escape closes.
 * - Popover uses a `gentle` spring — the iOS popover entry curve.
 * - Member row's "more" button uses a similar popover (placeholder
 *   actions for now).
 * - Email invite: button is disabled until a value is entered (Apple's
 *   "soft-disabled" pattern, not the system grey-out).
 */

const ROLES = ['Owner', 'Admin', 'Editor', 'Viewer'] as const;
type Role = (typeof ROLES)[number];

const ROLE_HUES: Record<Role, 'azure' | 'emerald' | 'lilac' | 'amethyst'> = {
  Owner: 'amethyst',
  Admin: 'azure',
  Editor: 'emerald',
  Viewer: 'lilac',
};

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 } }),
};

type Member = (typeof settings.team)[number];

export function SettingsTeam() {
  const [members, setMembers] = useState<Member[]>(settings.team);
  const [email, setEmail] = useState('');

  const changeRole = (id: string, role: Role) => {
    setMembers((m) => m.map((mem) => (mem.id === id ? { ...mem, role } : mem)));
    const member = members.find((m) => m.id === id);
    toast.success(`${member?.name} is now ${role}`);
  };

  const sendInvite = () => {
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email');
      return;
    }
    toast.success(`Invite sent to ${email}`);
    setEmail('');
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
      <Panel
        title="Members"
        subtitle="People with access to this workspace."
        action={
          <SaveRow
            onSave={() => toast.success('Team settings saved')}
            saveLabel="Save changes"
          />
        }
      >
        <InviteRow>
          <div style={{ flex: 1 }}>
            <TextInput
              placeholder="email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendInvite();
              }}
              aria-label="Email address"
            />
          </div>
          <InviteBtn
            type="button"
            onClick={sendInvite}
            disabled={!email.includes('@')}
            whileTap={email.includes('@') ? { scale: 0.97 } : undefined}
            transition={spring.snap}
          >
            <Plus size={13} strokeWidth={2} />
            Send invite
          </InviteBtn>
        </InviteRow>

        <TableWrap>
          <TableHeader>
            <div style={{ width: '34%' }}>Member</div>
            <div style={{ width: '24%' }}>Role</div>
            <div style={{ width: '16%' }}>Status</div>
            <div style={{ width: '18%' }}>Last active</div>
            <div style={{ width: '44px' }} />
          </TableHeader>
          {members.map((m, i) => {
            const initials = m.name.split(' ').map((s) => s[0]).slice(0, 2).join('');
            const hue = ROLE_HUES[m.role as Role] ?? 'azure';
            return (
              <MemberRow
                key={m.id}
                as={motion.div}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.spring, delay: i * 0.03 }}
              >
                <MemberCell>
                  <Avatar initials={initials} hue={hue} size={32} status={m.status === 'active' ? 'online' : 'idle'} />
                  <MemberInfo>
                    <MemberName>{m.name}</MemberName>
                    <MemberEmail>{m.email}</MemberEmail>
                  </MemberInfo>
                </MemberCell>
                <div style={{ width: '24%' }}>
                  <RoleMenu current={m.role as Role} onChange={(r) => changeRole(m.id, r)} />
                </div>
                <div style={{ width: '16%' }}>
                  <StatusPill tone={m.status === 'active' ? 'success' : 'warning'} dot>
                    {m.status}
                  </StatusPill>
                </div>
                <MemberLastActive>{m.lastActive}</MemberLastActive>
                <div style={{ width: '44px', display: 'flex', justifyContent: 'flex-end' }}>
                  <MemberMore member={m} />
                </div>
              </MemberRow>
            );
          })}
        </TableWrap>
      </Panel>
    </motion.div>
  );
}

// ─── RoleMenu — iOS-style popover picker ──────────────────────────────
function RoleMenu({ current, onChange }: { current: Role; onChange: (r: Role) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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
        {current}
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
                onClick={() => {
                  onChange(r);
                  setOpen(false);
                }}
                whileTap={{ scale: 0.985 }}
                transition={spring.snap}
              >
                <RoleDot $hue={ROLE_HUES[r]} aria-hidden="true" />
                <MenuLabel>{r}</MenuLabel>
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

// ─── MemberMore — secondary actions menu ─────────────────────────────
function MemberMore({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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
      <MoreBtn type="button" aria-label={`Actions for ${member.name}`} onClick={() => setOpen((o) => !o)} $open={open}>
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
                toast.success(`Reset password email sent to ${member.email}`);
                setOpen(false);
              }}
              whileTap={{ scale: 0.985 }}
              transition={spring.snap}
            >
              <MenuLabel>Resend invite</MenuLabel>
            </MenuItem>
            <MenuItem
              type="button"
              role="menuitem"
              onClick={() => {
                toast(`Copied ${member.email}`);
                setOpen(false);
              }}
              whileTap={{ scale: 0.985 }}
              transition={spring.snap}
            >
              <MenuLabel>Copy email</MenuLabel>
            </MenuItem>
            {member.role !== 'Owner' && (
              <MenuItem
                $danger
                type="button"
                role="menuitem"
                onClick={() => {
                  toast.error(`${member.name} removed from workspace`);
                  setOpen(false);
                }}
                whileTap={{ scale: 0.985 }}
                transition={spring.snap}
              >
                <MenuLabel>Remove member</MenuLabel>
              </MenuItem>
            )}
          </Menu>
        )}
      </AnimatePresence>
    </Wrap>
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

const InviteRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  margin-bottom: 16px;
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

const MemberRow = styled(motion.div)`
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
      ? 'linear-gradient(180deg, ${({ theme }) => theme.app.status.lilac.bg}, rgba(37,99,235,0.04))'
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
