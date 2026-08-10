import { PageHead } from '@components/common/PageHead';
import { SettingsGeneral } from '@/sections/pages/products/deployment/settings/tabs/SettingsGeneral';

export default function DeploymentSettingsGeneralPage() {
  return (
    <>
      <PageHead
        title="General settings"
        description="Workspace defaults, regions, and operational policy."
        canonicalPath="/deployment/settings/general"
      />
      <SettingsGeneral />
    </>
  );
}
