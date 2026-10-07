import { useSearch } from '@tanstack/react-router';
import { PageHead } from '@components/common/PageHead';
import { AgentBuilder } from '@/sections/pages/products/agent-studio/builder/AgentBuilder';

export default function AgentStudioAgentBuilderNewPage() {
  // Edit-through-create: ?edit=<assistantId> reopens this page prefilled
  // with the agent's identity; saving updates instead of creating.
  const search = useSearch({ strict: false }) as { edit?: unknown };
  const editAgentId = typeof search.edit === 'string' && search.edit !== '' ? search.edit : null;
  return (
    <>
      <PageHead
        title={editAgentId ? 'Edit agent' : 'New agent'}
        description="Name the agent, then wire it on the circuit — models, knowledge, tools, guardrails, memory, evaluation."
        canonicalPath="/agent-studio/agents/new"
      />
      <AgentBuilder mode="new" editAgentId={editAgentId} />
    </>
  );
}
