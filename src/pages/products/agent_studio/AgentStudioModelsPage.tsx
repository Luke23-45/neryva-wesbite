import { Outlet } from '@tanstack/react-router';
import { PageHead } from '@components/common/PageHead';
import { ModelsView } from '@/sections/pages/products/agent-studio/models';

export default function AgentStudioModelsPage() {
  return (
    <>
      <PageHead
        title="Models"
        description="Configure models, providers, and routing policies for your agents."
        canonicalPath="/agent-studio/models"
      />
      <ModelsView />
    </>
  );
}

/**
 * Layout for /agent-studio/models — renders child routes
 * (credentials/new, credentials/$credentialId/rotate) via the outlet.
 * Without this, TanStack Router drops every child route's component
 * (same class as A2-20).
 */
export function AgentStudioModelsLayout() {
  return <Outlet />;
}
