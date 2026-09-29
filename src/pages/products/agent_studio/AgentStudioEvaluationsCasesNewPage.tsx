import { PageHead } from '@components/common/PageHead';
import { CasesNewSection } from '@/sections/pages/products/agent-studio/evaluations/CasesNewSection';

export default function AgentStudioEvaluationsCasesNewPage() {
  return (
    <>
      <PageHead
        title="Add cases"
        description="Append eval cases to a dataset — input text plus lexical, state, and rubric expectations."
        canonicalPath="/agent-studio/evaluations/datasets/$datasetId/cases/new"
      />
      <CasesNewSection />
    </>
  );
}
