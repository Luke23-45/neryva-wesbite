import { PageHead } from '@components/common/PageHead';
import { AgentsOverviewView } from '@/sections/pages/products/agent-studio/agents/overview/AgentsOverviewView';

export default function AgentStudioAgentsOverviewPage() {
  return (
    <>
      <PageHead
        title="Agents overview"
        description="Fleet health across your agents — live status, drafts, and what needs attention."
        canonicalPath="/agent-studio/agents/overview"
      />
      <AgentsOverviewView />
    </>
  );
}
