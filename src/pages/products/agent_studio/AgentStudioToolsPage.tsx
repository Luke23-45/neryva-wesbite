import { PageHead } from '@components/common/PageHead';
import { ToolsView } from '@/sections/pages/products/agent-studio/tools';

export default function AgentStudioToolsPage() {
  return (
    <>
      <PageHead
        title="Tools"
        description="The org tool catalog that agent versions pin against."
        canonicalPath="/agent-studio/tools"
      />
      <ToolsView />
    </>
  );
}
