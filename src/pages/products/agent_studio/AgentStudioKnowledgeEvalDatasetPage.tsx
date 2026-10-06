import { PageHead } from '@components/common/PageHead';
import { EvalDatasetView } from '@/sections/pages/products/agent-studio/knowledge/EvalDatasetView';

export default function AgentStudioKnowledgeEvalDatasetPage({ params }: { params: { datasetId: string } }) {
  return (
    <>
      <PageHead
        title="Eval dataset detail"
        description="Golden queries, run results, and quality trends for a retrieval eval dataset."
        canonicalPath={`/agent-studio/knowledge/eval/${params.datasetId}`}
      />
      <EvalDatasetView datasetId={params.datasetId} />
    </>
  );
}
