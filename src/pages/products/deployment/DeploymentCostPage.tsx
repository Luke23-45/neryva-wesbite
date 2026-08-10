import { PageHead } from '@components/common/PageHead';
import { CostView } from '@/sections/pages/products/deployment/cost';

export default function DeploymentCostPage() {
  return (
    <>
      <PageHead
        title="Cost & usage"
        description="Spend across deployments, regions, and resource categories."
        canonicalPath="/deployment/cost"
      />
      <CostView />
    </>
  );
}
