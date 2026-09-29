import { Outlet } from '@tanstack/react-router';
import { PageHead } from '@components/common/PageHead';
import { BlocksView } from '@/sections/pages/products/agent-studio/libraries/blocks/BlocksView';

export default function AgentStudioBlocksPage() {
  return (
    <>
      <PageHead
        title="Blocks"
        description="Governance kill switches with expiry — what they refuse and why."
        canonicalPath="/agent-studio/blocks"
      />
      <BlocksView />
    </>
  );
}

/**
 * Layout for /agent-studio/blocks — renders child routes (new) via the
 * outlet. Without this, TanStack Router drops every child route's component
 * (same class as A2-20).
 */
export function AgentStudioBlocksLayout() {
  return <Outlet />;
}
