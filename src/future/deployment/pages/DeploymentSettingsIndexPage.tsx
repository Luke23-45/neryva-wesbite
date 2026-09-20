import { Outlet } from '@tanstack/react-router';
import { SettingsLayout } from '../sections/settings';

export default function DeploymentSettingsIndexPage() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  );
}

