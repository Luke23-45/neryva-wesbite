import { PageHead } from '@components/common/PageHead';
import { EvalView } from '@/sections/pages/products/agent-studio/knowledge/EvalView';

export default function AgentStudioKnowledgeEvalPage() {
  return (
    <>
      <PageHead
        title="Retrieval eval"
        description="Golden-query datasets for measuring retrieval quality over time."
        canonicalPath="/agent-studio/knowledge/eval"
      />
      <EvalView />
    </>
  );
}
