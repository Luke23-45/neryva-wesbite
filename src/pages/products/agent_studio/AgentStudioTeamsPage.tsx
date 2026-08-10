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
