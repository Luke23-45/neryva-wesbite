import { PageHead } from '@components/common/PageHead';
import { ScalingView } from '../sections/scaling';

export default function DeploymentScalingPage() {
  return (
    <>
      <PageHead
        title="Scaling"
        description="Auto-scaling rules, regional capacity, and replica lifecycle."
        canonicalPath="/deployment/scaling"
      />
      <ScalingView />
    </>
  );
}

