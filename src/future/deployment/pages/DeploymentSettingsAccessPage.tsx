import { PageHead } from '@components/common/PageHead';
import { SettingsAccess } from '../sections/settings/tabs/SettingsAccess';

export default function DeploymentSettingsAccessPage() {
  return (
    <>
      <PageHead
        title="Access"
        description="Manage workspace members, roles, and audit log."
        canonicalPath="/deployment/settings/access"
      />
      <SettingsAccess />
    </>
  );
}

