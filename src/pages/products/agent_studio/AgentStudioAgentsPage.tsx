import { Outlet } from '@tanstack/react-router';
import { PageHead } from '@components/common/PageHead';
import { AgentsView } from '@/sections/pages/products/agent-studio/agents';

export default function AgentStudioAgentsPage() {
  return (
    <>
      <PageHead
        title="Agents"
        description="Manage your AI agents — configurations, status, and performance."
        canonicalPath="/agent-studio/agents"
      />
      <AgentsView />
    </>
  );
}

/**
 * Layout for /agent-studio/agents — renders child routes (detail, edit,
 * build, new, overview) via the outlet. Without this, TanStack Router drops
 * every child route's component (A2-20).
 */
export function AgentStudioAgentsLayout() {
  return <Outlet />;
}
