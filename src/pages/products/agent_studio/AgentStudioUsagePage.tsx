import { PageHead } from '@components/common/PageHead';
import { UsageView } from '@/sections/pages/products/agent-studio/usage';

export default function AgentStudioUsagePage() {
  return (
    <>
      <PageHead
        title="Usage"
        description="Token consumption, costs, and quota limits across all agents and models."
        canonicalPath="/agent-studio/usage"
      />
      <UsageView />
    </>
  );
}
