import { PageHead } from '@components/common/PageHead';
import { LibrariesMemoryDetailSection } from '@/sections/pages/products/agent-studio/libraries/memory/MemoryDetailSection';

export default function AgentStudioLibrariesMemoryDetailPage() {
  return (
    <>
      <PageHead
        title="Memory detail"
        description="The stored memory row — scope, provenance, validity, and TTL."
        canonicalPath="/agent-studio/memory/$memoryId"
      />
      <LibrariesMemoryDetailSection />
    </>
  );
}
