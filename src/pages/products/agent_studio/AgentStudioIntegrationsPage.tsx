import { PageHead } from '@components/common/PageHead';
import { IntegrationsView } from '@/sections/pages/products/agent-studio/integrations';

export default function AgentStudioIntegrationsPage() {
  return (
    <>
      <PageHead
        title="Integrations"
        description="Connect your tools and data sources to give your agents the full picture."
        canonicalPath="/agent-studio/integrations"
      />
      <IntegrationsView />
    </>
  );
}
