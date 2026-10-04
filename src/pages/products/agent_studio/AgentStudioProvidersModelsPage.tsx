import { PageHead } from '@components/common/PageHead';
import { ModelsPage } from '@/sections/pages/products/agent-studio/providers/pages/ModelsPage';

export default function AgentStudioProvidersModelsPage() {
  return (
    <>
      <PageHead
        title="Providers · Models"
        description="Govern which models your agents can use — enable, disable, and review impact."
        canonicalPath="/agent-studio/providers/models"
      />
      <ModelsPage />
    </>
  );
}
