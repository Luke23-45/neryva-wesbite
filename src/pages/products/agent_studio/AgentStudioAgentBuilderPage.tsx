import { useParams, useSearch } from '@tanstack/react-router';
import { PageHead } from '@components/common/PageHead';
import { AgentBuilder } from '@/sections/pages/products/agent-studio/builder/AgentBuilder';

export default function AgentStudioAgentBuilderPage() {
  const params = useParams({ from: '/agent-studio/agents/$agentId/build' });
  const search = useSearch({ from: '/agent-studio/agents/$agentId/build' });
  return (
    <>
      <PageHead
        title="Agent builder"
        description="Wire the agent on the circuit — models, knowledge, tools, guardrails, memory, evaluation."
        canonicalPath="/agent-studio/agents/$agentId/build"
      />
      <AgentBuilder mode="build" agentId={params.agentId} initialSlot={search.slot ?? null} />
    </>
  );
}
