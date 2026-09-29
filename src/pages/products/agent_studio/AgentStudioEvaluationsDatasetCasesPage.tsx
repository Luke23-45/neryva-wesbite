import { PageHead } from '@components/common/PageHead';
import { CasesManagerSection } from '@/sections/pages/products/agent-studio/evaluations/CasesManagerSection';

export default function AgentStudioEvaluationsDatasetCasesPage() {
  return (
    <>
      <PageHead
        title="Dataset cases"
        description="List, edit, delete, import, and export an eval dataset's cases."
        canonicalPath="/agent-studio/evaluations/datasets/$datasetId/cases"
      />
      <CasesManagerSection />
    </>
  );
}
