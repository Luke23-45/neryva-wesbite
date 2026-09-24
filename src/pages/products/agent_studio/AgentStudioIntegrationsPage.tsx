import { Outlet } from '@tanstack/react-router';
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

/**
 * Layout for /agent-studio/integrations — renders child routes (webhooks)
 * via the outlet. Without this, TanStack Router drops every child route's
 * component (same class as A2-20).
 */
export function AgentStudioIntegrationsLayout() {
  return <Outlet />;
}
