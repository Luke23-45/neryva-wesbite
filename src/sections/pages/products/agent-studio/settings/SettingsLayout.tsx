import type { ReactNode } from 'react';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { Shell, TabsBar, Tab, TabLink, Body } from './SettingsLayout.styles';

const TABS = [
  { label: 'Profile', to: '/agent-studio/settings/profile' },
  { label: 'Workspace', to: '/agent-studio/settings/workspace' },
  { label: 'Team', to: '/agent-studio/settings/team' },
  { label: 'Billing', to: '/agent-studio/settings/billing' },
  { label: 'Security', to: '/agent-studio/settings/security' },
  { label: 'API Keys', to: '/agent-studio/settings/api-keys' },
];

export function SettingsLayout({ children }: { children: ReactNode }) {
  const matchRoute = useMatchRoute();
  return (
    <Shell>
      <TabsBar>
        {TABS.map((t) => {
          const active = matchRoute({ to: t.to, fuzzy: false });
          return (
            <Tab key={t.to} $active={!!active}>
              <TabLink as={Link} to={t.to}>
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
