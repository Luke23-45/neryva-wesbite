import { PageHead } from '@components/common/PageHead';
import { MemoryTimelineView } from '@/sections/pages/products/agent-studio/libraries/memory/MemoryTimelineView';

export default function AgentStudioLibrariesMemoryTimelinePage() {
  return (
    <>
      <PageHead
        title="Memory timeline"
        description="Full lifecycle history of a memory item with state transitions and reasons."
        canonicalPath="/agent-studio/memory/$memoryId/timeline"
      />
      <MemoryTimelineView />
    </>
  );
}
