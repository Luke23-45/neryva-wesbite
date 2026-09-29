import { PageHead } from '@components/common/PageHead';
import { InviteSection } from '@/sections/pages/products/agent-studio/teams/InviteSection';

export default function AgentStudioTeamsInvitePage() {
  return (
    <>
      <PageHead
        title="Invite a member"
        description="Send an invitation to join your workspace."
        canonicalPath="/agent-studio/teams/invite"
      />
      <InviteSection />
    </>
  );
}
