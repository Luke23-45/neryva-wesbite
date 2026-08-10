import { PageHead } from '@components/common/PageHead';
import { SecretsView } from '@/sections/pages/products/deployment/secrets';

export default function DeploymentSecretsPage() {
  return (
    <>
      <PageHead
        title="Secrets"
        description="Encrypted secrets shared across deployments."
        canonicalPath="/deployment/secrets"
      />
      <SecretsView />
    </>
  );
}
