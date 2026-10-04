import { PageHead } from '@components/common/PageHead';
import { MyProvidersPage } from '@/sections/pages/products/agent-studio/providers/pages/MyProvidersPage';

export default function AgentStudioProvidersMyProvidersPage() {
  return (
    <>
      <PageHead
        title="Providers · My Providers"
        description="Connect and manage your own provider API keys (BYOK)."
        canonicalPath="/agent-studio/providers/my-providers"
      />
      <MyProvidersPage />
    </>
  );
}
