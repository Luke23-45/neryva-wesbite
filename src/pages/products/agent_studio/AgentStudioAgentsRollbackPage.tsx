import { PageHead } from '@components/common/PageHead';
import { RollbackSection } from '@/sections/pages/products/agent-studio/agents/detail/RollbackSection';

export default function AgentStudioAgentsRollbackPage() {
  return (
    <>
      <PageHead
        title="Roll back to a prior version"
        description="Restore a prior published agent version as a new version — history is never rewritten."
        canonicalPath="/agent-studio/agents/$agentId/versions/rollback"
      />
      <RollbackSection />
    </>
  );
}
