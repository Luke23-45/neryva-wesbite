import { PageHead } from '@components/common/PageHead';
import { LibrariesMemoryNewSection } from '@/sections/pages/products/agent-studio/libraries/memory/MemoryNewSection';

export default function AgentStudioLibrariesMemoryNewPage() {
  return (
    <>
      <PageHead
        title="New memory"
        description="Save a memory your agents can use — scrubbed then embedded, TTL-defaulted, and audited."
        canonicalPath="/agent-studio/memory/new"
      />
      <LibrariesMemoryNewSection />
    </>
  );
}
