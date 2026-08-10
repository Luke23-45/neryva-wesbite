import { PageHead } from '@components/common/PageHead';
import { AgentsView } from '@/sections/pages/products/agent-studio/agents';

export default function AgentStudioAgentsPage() {
  return (
    <>
      <PageHead
        title="Agents"
        description="Manage your AI agents — configurations, status, and performance."
        canonicalPath="/agent-studio/agents"
      />
      <AgentsView />
    </>
  );
}
