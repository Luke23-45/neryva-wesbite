import { PageHead } from '@components/common/PageHead';
import { VersionImportSection } from '@/sections/pages/products/agent-studio/agents/detail/VersionImportSection';

export default function AgentStudioAgentsVersionImportPage() {
  return (
    <>
      <PageHead
        title="Import a definition"
        description="Import an agent definition from an export file — it lands as a draft version."
        canonicalPath="/agent-studio/agents/$agentId/versions/import"
      />
      <VersionImportSection />
    </>
  );
}
