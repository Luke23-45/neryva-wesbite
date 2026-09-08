import { PageHead } from '@components/common/PageHead';
import { AgentEditor } from '@/sections/pages/products/agent-studio/agents/AgentEditor';

export default function AgentStudioAgentEditPage() {
  return (
    <>
      <PageHead
        title="Edit agent"
        description="Edit this agent's definition — instructions, model policy, tools, guardrails, and budgets."
        canonicalPath="/agent-studio/agents"
      />
      <AgentEditor />
    </>
  );
}
