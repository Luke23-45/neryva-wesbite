import { PageHead } from '@components/common/PageHead';
import { BlockNewSection } from '@/sections/pages/products/agent-studio/agents/detail/BlockNewSection';

export default function AgentStudioAgentsBlockNewPage() {
  return (
    <>
      <PageHead
        title="Set control block"
        description="Set a governance control block on an agent — refuses acceptance, assignment, tool calls, credentials, and installs."
        canonicalPath="/agent-studio/agents/$agentId/block/new"
      />
      <BlockNewSection />
    </>
  );
}
