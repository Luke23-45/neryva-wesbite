import { PageHead } from '@components/common/PageHead';
import { InfrastructureView } from '../sections/infrastructure';

export default function DeploymentInfrastructurePage() {
  return (
    <>
      <PageHead
        title="Infrastructure"
        description="Region health, cluster utilization, and runtime distribution across your fleet."
        canonicalPath="/deployment/infrastructure"
      />
      <InfrastructureView />
    </>
  );
}

