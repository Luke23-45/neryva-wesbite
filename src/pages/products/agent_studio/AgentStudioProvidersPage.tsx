import { PageHead } from '@components/common/PageHead';
import { ProvidersPage } from '@/sections/pages/products/agent-studio/providers/ProvidersPage';

export default function AgentStudioProvidersPage() {
  return (
    <>
      <PageHead
        title="Providers"
        description="Browse the model catalog, connect your own API keys, and govern which models your agents can use."
        canonicalPath="/agent-studio/providers"
      />
      <ProvidersPage />
    </>
  );
}
