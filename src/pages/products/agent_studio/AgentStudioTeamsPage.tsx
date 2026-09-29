import { Outlet } from '@tanstack/react-router';
import { PageHead } from '@components/common/PageHead';
import { TeamsView } from '@/sections/pages/products/agent-studio/teams';

export default function AgentStudioTeamsPage() {
  return (
    <>
      <PageHead
        title="Teams"
        description="Workspace members, invitations, service accounts, and access groups."
        canonicalPath="/agent-studio/teams"
      />
      <TeamsView />
    </>
  );
}

/**
 * Layout for /agent-studio/teams — renders child routes (invite,
 * groups/new, service-accounts/new) via the outlet. Without this, TanStack
 * Router drops every child route's component (same class as A2-20).
 */
export function AgentStudioTeamsLayout() {
  return <Outlet />;
}
