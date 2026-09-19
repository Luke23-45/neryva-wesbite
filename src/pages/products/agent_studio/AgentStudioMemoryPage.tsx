import { PageHead } from '@components/common/PageHead';
import { MemoryView } from '@/sections/pages/products/agent-studio/libraries/memory/MemoryView';

export default function AgentStudioMemoryPage() {
  return (
    <>
      <PageHead
        title="Memory"
        description="What your agents remember — scoped, TTL-bound, and deletable."
        canonicalPath="/agent-studio/memory"
      />
      <MemoryView />
    </>
  );
}
