import { PageHead } from '@components/common/PageHead';
import { NetworkView } from '@/sections/pages/products/deployment/network';

export default function DeploymentNetworkPage() {
  return (
    <>
      <PageHead
        title="Network"
        description="Endpoints, VPC, DNS, and CDN for the deployment surface."
        canonicalPath="/deployment/network"
      />
      <NetworkView />
    </>
  );
}
