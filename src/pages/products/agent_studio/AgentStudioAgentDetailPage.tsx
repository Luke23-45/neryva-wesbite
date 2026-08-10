import { PageHead } from '@components/common/PageHead';
import { AgentDetailView } from '@/sections/pages/products/agent-studio/agents';

export default function AgentStudioAgentDetailPage() {
  return (
    <>
      <PageHead
        title="Agent"
        description="View and configure an AI agent."
        canonicalPath="/agent-studio/agents/$agentId"
      />
      <AgentDetailView />
    </>
  );
}
