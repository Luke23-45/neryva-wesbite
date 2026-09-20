import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { User, Settings, Keyboard, LogOut, Bell, Building2 } from 'lucide-react';
import { ease } from '@styles/motion';
import { logout } from '@lib/engine/auth';
import {
  Trigger,
  Header,
  Avatar,
  HeaderBody,
  HeaderName,
  HeaderEmail,
  MenuSection,
} from './AccountMenu.styles';
import { Popover, PopoverPanel, MenuItem, MenuIcon, MenuLabel, MenuHint, Divider } from '@/sections/pages/products/agent-studio/Popover/Popover.styles';

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
              <MenuItem as={Link} to="/deployment/settings/general" onClick={() => setOpen(false)}>
                <MenuIcon><User size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>General settings</MenuLabel>
              </MenuItem>
              <MenuItem as={Link} to="/deployment/settings/environments" onClick={() => setOpen(false)}>
                <MenuIcon><Building2 size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>
                  Environments
                  <MenuHint>{workspace.name}</MenuHint>
                </MenuLabel>
              </MenuItem>
              <MenuItem as={Link} to="/deployment/settings/access" onClick={() => setOpen(false)}>
                <MenuIcon><Settings size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>Access control</MenuLabel>
              </MenuItem>
              <MenuItem as={Link} to="/deployment/alerts" onClick={() => setOpen(false)}>
                <MenuIcon><Bell size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>Alerts</MenuLabel>
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
