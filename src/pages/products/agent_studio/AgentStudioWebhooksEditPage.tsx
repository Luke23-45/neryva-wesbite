import { PageHead } from '@components/common/PageHead';
import { WebhookEditSection } from '@/sections/pages/products/agent-studio/integrations/WebhookEditSection';

export default function AgentStudioWebhooksEditPage() {
  return (
    <>
      <PageHead
        title="Edit webhook"
        description="Update a webhook's destination, subscriptions, description, or status."
        canonicalPath="/agent-studio/integrations/webhooks/$webhookId/edit"
      />
      <WebhookEditSection />
    </>
  );
}
