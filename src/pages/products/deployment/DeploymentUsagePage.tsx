import { PageHead } from '@components/common/PageHead';
import { UsageView } from '@/sections/pages/products/deployment/usage';

export default function DeploymentUsagePage() {
  return (
    <>
      <PageHead
        title="Usage"
        description="Request volume, compute, bandwidth, and rate limits across all deployments."
        canonicalPath="/deployment/usage"
      />
      <UsageView />
    </>
  );
}
