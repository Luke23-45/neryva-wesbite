import { PageHead } from '@components/common/PageHead';
import { ToolNewSection } from '@/sections/pages/products/agent-studio/tools/ToolNewSection';

export default function AgentStudioToolsNewPage() {
  return (
    <>
      <PageHead
        title="Register a tool"
        description="Register a custom tool in the org tool catalog. Name is path-authoritative and lowercased; endpoint and credential are create-only."
        canonicalPath="/agent-studio/tools/new"
      />
      <ToolNewSection />
    </>
  );
}
