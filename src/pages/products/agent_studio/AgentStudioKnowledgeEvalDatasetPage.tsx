import { PageHead } from '@components/common/PageHead';
import { EvalDatasetView } from '@/sections/pages/products/agent-studio/knowledge/EvalDatasetView';

export default function AgentStudioKnowledgeEvalDatasetPage() {
  return (
    <>
      <PageHead
        title="Eval dataset detail"
        description="Golden queries, run results, and quality trends for a retrieval eval dataset."
        canonicalPath="/agent-studio/knowledge/eval/$datasetId"
      />
      <EvalDatasetView />
    </>
  );
}
