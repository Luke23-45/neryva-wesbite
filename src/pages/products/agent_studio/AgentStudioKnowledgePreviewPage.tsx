import { PageHead } from '@components/common/PageHead';
import { PreviewSection } from '@/sections/pages/products/agent-studio/knowledge/PreviewSection';

/** Page for /agent-studio/knowledge/$docId/preview. */
export default function AgentStudioKnowledgePreviewPage() {
  return (
    <>
      <PageHead
        title="Document preview"
        description="Inspect the stored text agents retrieve — latest-version chunks in sequence order."
        canonicalPath="/agent-studio/knowledge/$docId/preview"
      />
      <PreviewSection />
    </>
  );
}
