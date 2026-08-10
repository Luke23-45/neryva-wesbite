import { PageHead } from '@components/common/PageHead';
import { SettingsNotifications } from '@/sections/pages/products/deployment/settings/tabs/SettingsNotifications';

export default function DeploymentSettingsNotificationsPage() {
  return (
    <>
      <PageHead
        title="Notifications"
        description="Configure notification channels and event delivery."
        canonicalPath="/deployment/settings/notifications"
      />
      <SettingsNotifications />
    </>
  );
}
