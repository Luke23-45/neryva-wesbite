import { PageHead } from '@components/common/PageHead';
import { ApiKeyCreateSection } from '@/sections/pages/products/agent-studio/settings/ApiKeyCreateSection';

export default function AgentStudioSettingsApiKeyNewPage() {
  return (
    <>
      <PageHead
        title="Create API key"
        description="Create a new API key for programmatic access to your workspace."
        canonicalPath="/agent-studio/settings/api-keys/new"
      />
      <ApiKeyCreateSection />
    </>
  );
}
