import { PageHead } from '@components/common/PageHead';
import { ApiView } from '@/sections/pages/products/agent-studio/api';

export default function AgentStudioApiPage() {
  return (
    <>
      <PageHead
        title="API explorer"
        description="Interactive reference for the Neryva API."
        canonicalPath="/agent-studio/api"
      />
      <ApiView />
    </>
  );
}
