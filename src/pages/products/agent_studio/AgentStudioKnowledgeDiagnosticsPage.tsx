import { PageHead } from '@components/common/PageHead';
import { DiagnosticsView } from '@/sections/pages/products/agent-studio/knowledge/DiagnosticsView';

export default function AgentStudioKnowledgeDiagnosticsPage() {
  return (
    <>
      <PageHead
        title="Diagnostics"
        description="Why a document did or didn't surface for a query."
        canonicalPath="/agent-studio/knowledge/$docId/diagnostics"
      />
      <DiagnosticsView />
    </>
  );
}
