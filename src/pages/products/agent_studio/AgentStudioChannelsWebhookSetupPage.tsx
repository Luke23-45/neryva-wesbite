import { PageHead } from '@components/common/PageHead';
import { WebhookSetupSection } from '@/sections/pages/products/agent-studio/channels/WebhookSetupSection';

export default function AgentStudioChannelsWebhookSetupPage() {
  return (
    <>
      <PageHead
        title="Webhook setup"
        description="Get the callback URL and the once-shown verify token for a channel account."
        canonicalPath="/agent-studio/channels/$accountId/webhook-setup"
      />
      <WebhookSetupSection />
    </>
  );
}
