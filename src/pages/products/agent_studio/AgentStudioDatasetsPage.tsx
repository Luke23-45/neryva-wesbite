import { PageHead } from '@components/common/PageHead';
import { DatasetsView } from '@/sections/pages/products/agent-studio/libraries/datasets/DatasetsView';

export default function AgentStudioDatasetsPage() {
  return (
    <>
      <PageHead
        title="Datasets"
        description="Evaluation datasets your agents measure against."
        canonicalPath="/agent-studio/datasets"
      />
      <DatasetsView />
    </>
  );
}
