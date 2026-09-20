import { PageHead } from '@components/common/PageHead';
import { DeploymentsView } from '../sections/deployments';

export default function DeploymentDeploymentsPage() {
  return (
    <>
      <PageHead
        title="Deployments"
        description="Active model deployments across all environments and regions."
        canonicalPath="/deployment/deployments"
      />
      <DeploymentsView />
    </>
  );
}

