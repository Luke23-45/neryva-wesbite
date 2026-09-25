import type { ReactNode } from 'react';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { Shell, TabsBar, Tab, TabLink, Body } from './SettingsLayout.styles';
import { useOrg } from '@/Context/OrgContext';

const TABS = [
  { label: 'Profile', to: '/agent-studio/settings/profile' },
  // B2: admin surfaces are hidden from non-manager roles in the settings
  // nav (server stays authoritative for deep links).
  // B2 (corrected): Team shows the member roster, which every role may read
  // server-side — hiding it confused "can't mutate" with "can't see".
  // Invite/mutation controls stay gated inside SettingsTeam; Workspace
  // (branding PATCH) is genuinely admin-only.
  { label: 'Workspace', to: '/agent-studio/settings/workspace', adminOnly: true },
  { label: 'Team', to: '/agent-studio/settings/team' },
  { label: 'Billing', to: '/agent-studio/settings/billing' },
  { label: 'Security', to: '/agent-studio/settings/security' },
  { label: 'API Keys', to: '/agent-studio/settings/api-keys' },
];

export function SettingsLayout({ children }: { children: ReactNode }) {
  const matchRoute = useMatchRoute();
  const { canManageMembers } = useOrg();
  const visible = TABS.filter((t) => !t.adminOnly || canManageMembers);
  return (
    <Shell>
      <TabsBar aria-label="Settings sections">
        {visible.map((t) => {
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
