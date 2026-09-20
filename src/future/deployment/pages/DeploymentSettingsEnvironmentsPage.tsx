import { PageHead } from '@components/common/PageHead';
import { SettingsEnvironments } from '../sections/settings/tabs/SettingsEnvironments';

export default function DeploymentSettingsEnvironmentsPage() {
  return (
    <>
      <PageHead
        title="Environments"
        description="Configure deployment environments, regions, and promotion paths."
        canonicalPath="/deployment/settings/environments"
      />
      <SettingsEnvironments />
    </>
  );
}

