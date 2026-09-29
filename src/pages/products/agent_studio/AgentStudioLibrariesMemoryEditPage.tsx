import { PageHead } from '@components/common/PageHead';
import { LibrariesMemoryEditSection } from '@/sections/pages/products/agent-studio/libraries/memory/MemoryEditSection';

export default function AgentStudioLibrariesMemoryEditPage() {
  return (
    <>
      <PageHead
        title="Edit memory"
        description="Correct a stored memory's content — re-scrubbed, re-embedded, and audited."
        canonicalPath="/agent-studio/memory/$memoryId/edit"
      />
      <LibrariesMemoryEditSection />
    </>
  );
}
