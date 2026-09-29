import { PageHead } from '@components/common/PageHead';
import { WebhookNewSection } from '@/sections/pages/products/agent-studio/integrations/WebhookNewSection';

export default function AgentStudioWebhooksNewPage() {
  return (
    <>
      <PageHead
        title="New webhook"
        description="Add an endpoint — every subscribed agent event arrives there, signed."
        canonicalPath="/agent-studio/integrations/webhooks/new"
      />
      <WebhookNewSection />
    </>
  );
}
