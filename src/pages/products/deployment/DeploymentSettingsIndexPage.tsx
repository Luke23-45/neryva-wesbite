import { Outlet } from '@tanstack/react-router';
import { SettingsLayout } from '@/sections/pages/products/deployment/settings';

export default function DeploymentSettingsIndexPage() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  );
}
