import { PageHead } from '@components/common/PageHead';
import { DeployDetailView } from '../sections/deployments/detail';

export default function DeploymentDeployDetailPage() {
  return (
    <>
      <PageHead
        title="Deployment"
        description="View deployment details, resource utilization, and configuration."
        canonicalPath="/deployment/deployments"
      />
      <DeployDetailView />
    </>
  );
}

