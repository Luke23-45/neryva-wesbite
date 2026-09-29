import { PageHead } from '@components/common/PageHead';
import { DatasetNewSection } from '@/sections/pages/products/agent-studio/evaluations/DatasetNewSection';

export default function AgentStudioEvaluationsDatasetNewPage() {
  return (
    <>
      <PageHead
        title="New dataset"
        description="Create an eval dataset — the regression suite your publish gates read."
        canonicalPath="/agent-studio/evaluations/datasets/new"
      />
      <DatasetNewSection />
    </>
  );
}
