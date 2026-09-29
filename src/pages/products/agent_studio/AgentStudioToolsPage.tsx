import { Outlet } from '@tanstack/react-router';
import { PageHead } from '@components/common/PageHead';
import { ToolsView } from '@/sections/pages/products/agent-studio/tools';

export default function AgentStudioToolsPage() {
  return (
    <>
      <PageHead
        title="Tools"
        description="The org tool catalog that agent versions pin against."
        canonicalPath="/agent-studio/tools"
      />
      <ToolsView />
    </>
  );
}

/**
 * Layout for /agent-studio/tools — renders child routes
 * (new, $toolId/edit) via the outlet. Without this, TanStack Router drops
 * every child route's component (same class as A2-20).
 */
export function AgentStudioToolsLayout() {
  return <Outlet />;
}
