import { PageHead } from '@components/common/PageHead';
import { ModelsView } from '@/sections/pages/products/agent-studio/models';

export default function AgentStudioModelsPage() {
  return (
    <>
      <PageHead
        title="Models"
        description="Configure models, providers, and routing policies for your agents."
        canonicalPath="/agent-studio/models"
      />
      <ModelsView />
    </>
  );
}
