import { PageHead } from '@components/common/PageHead';
import { ToolInstantiateSection } from '@/sections/pages/products/agent-studio/tools/ToolInstantiateSection';

export default function AgentStudioToolsInstantiatePage() {
  return (
    <>
      <PageHead
        title="Instantiate a tool"
        description="Instantiate a prebuilt tool template into the org tool catalog. Instantiation upserts by template name."
        canonicalPath="/agent-studio/tools/instantiate"
      />
      <ToolInstantiateSection />
    </>
  );
}
