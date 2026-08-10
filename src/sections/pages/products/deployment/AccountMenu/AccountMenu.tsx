import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import {
  User,
  Settings,
  BookOpen,
  Keyboard,
  LogOut,
  CreditCard,
  Building2,
} from 'lucide-react';
import {
  Popover,
  PopoverPanel,
  MenuItem,
  MenuIcon,
  MenuLabel,
  MenuHint,
  Divider,
} from '@/sections/pages/products/agent-studio/Popover/Popover.styles';

type Props = {
  user: { initials: string; name: string; tier: string; email: string };
  workspace: { name: string; plan: string };
};

export function AccountMenu({ user, workspace }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <Popover ref={ref}>
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.10)',
          background:
            'linear-gradient(135deg, rgba(245,158,11,0.30) 0%, rgba(37,99,235,0.30) 100%)',
          color: '#fff',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {user.initials}
      </button>
      <AnimatePresence>
        {open && (
          <PopoverPanel
            role="dialog"
            aria-label="Account menu"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            $width={280}
          >
            <div
              style={{
                padding: '14px 16px',
                display: 'flex',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background:
                    'linear-gradient(135deg, #f59e0b 0%, #2563eb 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {user.initials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, color: '#f5f7fb', fontWeight: 500 }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(229,231,235,0.55)', marginTop: 2 }}>
                  {user.email}
                </div>
              </div>
            </div>
            <Divider />
            <div style={{ padding: '6px' }}>
              <MenuItem as={Link} to="/deployment/settings/general">
                <MenuIcon><User size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>Profile</MenuLabel>
              </MenuItem>
              <MenuItem as={Link} to="/deployment/settings/environments">
                <MenuIcon><Building2 size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>
                  Environments
                  <MenuHint>{workspace.name}</MenuHint>
                </MenuLabel>
              </MenuItem>
              <MenuItem as={Link} to="/deployment/settings/notifications">
                <MenuIcon><CreditCard size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>Notifications</MenuLabel>
              </MenuItem>
              <MenuItem as={Link} to="/deployment/settings">
                <MenuIcon><Settings size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>All settings</MenuLabel>
              </MenuItem>
            </div>
            <Divider />
            <div style={{ padding: '6px' }}>
              <MenuItem as="a" href="/docs">
                <MenuIcon><BookOpen size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>Docs</MenuLabel>
              </MenuItem>
              <MenuItem type="button">
                <MenuIcon><Keyboard size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>
                  Keyboard shortcuts
                  <MenuHint>⌘ /</MenuHint>
                </MenuLabel>
              </MenuItem>
              <MenuItem
                type="button"
                $tone="danger"
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  sessionStorage.removeItem('accessToken');
                  window.location.href = '/auth';
                }}
              >
                <MenuIcon><LogOut size={14} strokeWidth={1.7} /></MenuIcon>
                <MenuLabel>Sign out</MenuLabel>
              </MenuItem>
            </div>
          </PopoverPanel>
        )}
      </AnimatePresence>
    </Popover>
  );
}
