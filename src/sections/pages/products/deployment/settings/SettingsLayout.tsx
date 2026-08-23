import type { ReactNode } from 'react';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { Shell, TabsBar, Tab, TabLink, Body } from './SettingsLayout.styles';

const TABS = [
  { label: 'General', to: '/deployment/settings/general' },
  { label: 'Environments', to: '/deployment/settings/environments' },
  { label: 'Notifications', to: '/deployment/settings/notifications' },
  { label: 'Access', to: '/deployment/settings/access' },
];

export function SettingsLayout({ children }: { children: ReactNode }) {
  const matchRoute = useMatchRoute();
  return (
    <Shell>
      <TabsBar aria-label="Settings sections">
        {TABS.map((t) => {
          const active = matchRoute({ to: t.to, fuzzy: false });
          return (
            <Tab key={t.to} $active={!!active}>
              <TabLink as={Link} to={t.to} $active={!!active} aria-current={active ? 'page' : undefined}>
                {t.label}
              </TabLink>
            </Tab>
          );
        })}
      </TabsBar>
      <Body>{children}</Body>
    </Shell>
  );
}
