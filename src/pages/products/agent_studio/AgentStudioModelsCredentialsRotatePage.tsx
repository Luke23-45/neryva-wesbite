import { PageHead } from '@components/common/PageHead';
import { CredentialRotateSection } from '@/sections/pages/products/agent-studio/models/CredentialRotateSection';

export default function AgentStudioModelsCredentialsRotatePage() {
  return (
    <>
      <PageHead
        title="Rotate credential"
        description="Rotate a provider credential. The new secret seals on arrival."
        canonicalPath="/agent-studio/models/credentials/$credentialId/rotate"
      />
      <CredentialRotateSection />
    </>
  );
}
