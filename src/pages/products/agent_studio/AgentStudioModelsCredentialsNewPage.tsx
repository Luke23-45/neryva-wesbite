import { PageHead } from '@components/common/PageHead';
import { CredentialNewSection } from '@/sections/pages/products/agent-studio/models/CredentialNewSection';

export default function AgentStudioModelsCredentialsNewPage() {
  return (
    <>
      <PageHead
        title="Add provider credential"
        description="Add a provider credential for model access (BYOK). The secret seals on arrival."
        canonicalPath="/agent-studio/models/credentials/new"
      />
      <CredentialNewSection />
    </>
  );
}
