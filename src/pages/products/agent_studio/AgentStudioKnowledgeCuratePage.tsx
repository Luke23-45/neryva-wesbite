import { PageHead } from '@components/common/PageHead';
import { CurateView } from '@/sections/pages/products/agent-studio/knowledge/CurateView';

export default function AgentStudioKnowledgeCuratePage() {
  return (
    <>
      <PageHead
        title="Curate document"
        description="Review status, ownership, and provenance."
        canonicalPath="/agent-studio/knowledge/$docId/curate"
      />
      <CurateView />
    </>
  );
}
