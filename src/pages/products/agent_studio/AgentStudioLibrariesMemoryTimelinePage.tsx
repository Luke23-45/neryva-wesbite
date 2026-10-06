import { PageHead } from '@components/common/PageHead';
import { MemoryTimelineView } from '@/sections/pages/products/agent-studio/libraries/memory/MemoryTimelineView';

export default function AgentStudioLibrariesMemoryTimelinePage({ params }: { params: { memoryId: string } }) {
  return (
    <>
      <PageHead
        title="Memory timeline"
        description="Full lifecycle history of a memory item with state transitions and reasons."
        canonicalPath={`/agent-studio/memory/${params.memoryId}/timeline`}
      />
      <MemoryTimelineView memoryId={params.memoryId} />
    </>
  );
}
