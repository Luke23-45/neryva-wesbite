import { PageHead } from '@components/common/PageHead';
import { AgentBuilder } from '@/sections/pages/products/agent-studio/builder/AgentBuilder';

export default function AgentStudioAgentBuilderNewPage() {
  return (
    <>
      <PageHead
        title="New agent"
        description="Name the agent, then wire it on the circuit — models, knowledge, tools, guardrails, memory, evaluation."
        canonicalPath="/agent-studio/agents/new"
      />
      <AgentBuilder mode="new" />
    </>
  );
}
