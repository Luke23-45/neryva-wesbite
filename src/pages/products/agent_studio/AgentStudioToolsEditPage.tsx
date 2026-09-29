import { PageHead } from '@components/common/PageHead';
import { ToolEditSection } from '@/sections/pages/products/agent-studio/tools/ToolEditSection';

export default function AgentStudioToolsEditPage() {
  return (
    <>
      <PageHead
        title="Edit tool"
        description="Edit a tool in the org tool catalog. Only the shown fields change; the endpoint binding and sealed credential are preserved."
        canonicalPath="/agent-studio/tools/$toolId/edit"
      />
      <ToolEditSection />
    </>
  );
}
