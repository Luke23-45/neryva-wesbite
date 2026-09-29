import { PageHead } from '@components/common/PageHead';
import { LinkProviderSection } from '@/sections/pages/products/agent-studio/integrations/LinkProviderSection';

export default function AgentStudioIntegrationsLinkPage() {
  return (
    <>
      <PageHead
        title="Link provider"
        description="Link a provider account to sync content into the knowledge pipeline."
        canonicalPath="/agent-studio/integrations/link"
      />
      <LinkProviderSection />
    </>
  );
}
