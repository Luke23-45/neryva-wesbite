import { PageHead } from '@components/common/PageHead';
import { DashboardView } from '@/sections/pages/products/deployment/dashboard';

export default function DeploymentDashboardPage() {
  return (
    <>
      <PageHead
        title="Dashboard"
        description="Monitor deployments, pipelines, and infrastructure health across all regions."
        canonicalPath="/deployment/dashboard"
      />
      <DashboardView />
    </>
  );
}
