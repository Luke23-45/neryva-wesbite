import { PageHead } from '@components/common/PageHead';
import { GroupCreateSection } from '@/sections/pages/products/agent-studio/teams/GroupCreateSection';

export default function AgentStudioTeamsGroupNewPage() {
  return (
    <>
      <PageHead
        title="Create a group"
        description="Create an access group for your workspace."
        canonicalPath="/agent-studio/teams/groups/new"
      />
      <GroupCreateSection />
    </>
  );
}
