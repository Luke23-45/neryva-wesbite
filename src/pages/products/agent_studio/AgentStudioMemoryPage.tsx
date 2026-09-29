import { Outlet } from '@tanstack/react-router';
import { PageHead } from '@components/common/PageHead';
import { MemoryView } from '@/sections/pages/products/agent-studio/libraries/memory/MemoryView';

export default function AgentStudioMemoryPage() {
  return (
    <>
      <PageHead
        title="Memory"
        description="What your agents remember — scoped, TTL-bound, and deletable."
        canonicalPath="/agent-studio/memory"
      />
      <MemoryView />
    </>
  );
}

/**
 * Layout for /agent-studio/memory — renders child routes
 * (new, $memoryId, $memoryId/edit) via the outlet. Without this, TanStack
 * Router drops every child route's component (same class as A2-20).
 */
export function AgentStudioMemoryLayout() {
  return <Outlet />;
}
