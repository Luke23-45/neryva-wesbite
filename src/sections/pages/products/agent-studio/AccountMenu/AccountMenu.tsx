import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { User, Settings, Keyboard, LogOut, CreditCard, Building2 } from 'lucide-react';
import { logout } from '@lib/engine/auth';
import { ease } from '@styles/motion';
import {
  Trigger,
  Header,
  Avatar,
  HeaderBody,
  HeaderName,
  HeaderEmail,
  MenuSection,
} from './AccountMenu.styles';
import { Popover, PopoverPanel, MenuItem, MenuIcon, MenuLabel, MenuHint, Divider } from '../Popover/Popover.styles';

type Props = {
  user: { initials: string; name: string; tier: string; email: string };
  workspace: { name: string; plan: string };
  onOpenShortcuts?: () => void;
};

export function AccountMenu({ user, workspace, onOpenShortcuts }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <Popover ref={ref}>
      <Trigger
        type="button"
        aria-label="Account menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {user.initials}
      </Trigger>
      <AnimatePresence>
        {open && (
          <PopoverPanel
            role="dialog"
            aria-label="Account menu"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: ease.premium }}
            $width={280}
          >
            <Header>
              <Avatar aria-hidden="true">{user.initials}</Avatar>
              <HeaderBody>
                <HeaderName>{user.name}</HeaderName>
                <HeaderEmail>{user.email}</HeaderEmail>
              </HeaderBody>
            </Header>
            <Divider />
            <MenuSection>
              <MenuItem as={Link} to="/agent-studio/settings/profile" onClick={() => setOpen(false)}>
                <MenuIcon><User size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>Profile</MenuLabel>
              </MenuItem>
              <MenuItem as={Link} to="/agent-studio/settings/workspace" onClick={() => setOpen(false)}>
                <MenuIcon><Building2 size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>
                  Workspace
                  <MenuHint>{workspace.name}</MenuHint>
                </MenuLabel>
              </MenuItem>
              <MenuItem as={Link} to="/agent-studio/settings/billing" onClick={() => setOpen(false)}>
                <MenuIcon><CreditCard size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>Billing</MenuLabel>
              </MenuItem>
              <MenuItem as={Link} to="/agent-studio/settings" onClick={() => setOpen(false)}>
                <MenuIcon><Settings size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>All settings</MenuLabel>
              </MenuItem>
            </MenuSection>
            <Divider />
            <MenuSection>
              <MenuItem
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenShortcuts?.();
                }}
              >
                <MenuIcon><Keyboard size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>
                  Command palette
                  <MenuHint>⌘K</MenuHint>
                </MenuLabel>
              </MenuItem>
              <MenuItem
                type="button"
                $tone="danger"
                onClick={() => {
                  setOpen(false);
                  // Ends the OP session (RP-initiated logout) and clears the
                  // local session store — never hand-roll token removal here.
                  void logout();
                }}
              >
                <MenuIcon><LogOut size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>Sign out</MenuLabel>
              </MenuItem>
            </MenuSection>
          </PopoverPanel>
        )}
      </AnimatePresence>
    </Popover>
  );
}
