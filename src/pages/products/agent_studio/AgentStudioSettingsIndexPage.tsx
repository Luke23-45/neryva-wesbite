import { Outlet } from '@tanstack/react-router';
import { SettingsLayout } from '@/sections/pages/products/agent-studio/settings';

export default function AgentStudioSettingsIndexPage() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  );
}
