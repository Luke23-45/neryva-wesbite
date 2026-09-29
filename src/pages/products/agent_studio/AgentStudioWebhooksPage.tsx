import { Outlet } from '@tanstack/react-router';
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

/**
 * Layout for /agent-studio/integrations/webhooks — renders child routes
 * (new, $webhookId/edit) via the outlet. Without this, TanStack Router drops
 * every child route's component (same class as A2-20).
 */
export function AgentStudioWebhooksLayout() {
  return <Outlet />;
}
