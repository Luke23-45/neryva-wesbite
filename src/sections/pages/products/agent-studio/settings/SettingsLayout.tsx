import type { ReactNode } from 'react';
import { Shell, Body } from './SettingsLayout.styles';

/**
 * Settings page shell. Previously this also rendered a tab bar duplicating
 * the sidebar's SETTINGS items (Profile, Workspace, Team, Billing, Security,
 * API Keys); the tabs were removed because the sidebar already navigates to
 * the same six routes. What remains is the centered content container.
 */
export function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <Body>{children}</Body>
    </Shell>
  );
}
