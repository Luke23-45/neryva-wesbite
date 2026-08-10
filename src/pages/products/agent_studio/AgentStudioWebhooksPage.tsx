import { PageHead } from '@components/common/PageHead';
import { WebhooksView } from '@/sections/pages/products/agent-studio/integrations';

export default function AgentStudioWebhooksPage() {
  return (
    <>
      <PageHead
        title="Webhooks"
        description="Send agent events to your own HTTP endpoint."
        canonicalPath="/agent-studio/integrations/webhooks"
      />
      <WebhooksView />
    </>
  );
}
