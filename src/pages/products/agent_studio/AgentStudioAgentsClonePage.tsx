import { PageHead } from '@components/common/PageHead';
import { CloneSection } from '@/sections/pages/products/agent-studio/agents/CloneSection';

export default function AgentStudioAgentsClonePage() {
  return (
    <>
      <PageHead
        title="Clone an agent"
        description="Pick a source agent and name the copy — cloning creates a new draft, the original is untouched."
        canonicalPath="/agent-studio/agents/clone"
      />
      <CloneSection />
    </>
  );
}
