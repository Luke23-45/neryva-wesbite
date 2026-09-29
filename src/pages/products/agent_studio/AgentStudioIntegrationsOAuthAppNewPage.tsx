import { PageHead } from '@components/common/PageHead';
import { OAuthAppCreateSection } from '@/sections/pages/products/agent-studio/integrations/OAuthAppCreateSection';

export default function AgentStudioIntegrationsOAuthAppNewPage() {
  return (
    <>
      <PageHead
        title="Register OAuth app"
        description="Register a per-tenant provider app for the OAuth dance."
        canonicalPath="/agent-studio/integrations/oauth-apps/new"
      />
      <OAuthAppCreateSection />
    </>
  );
}
