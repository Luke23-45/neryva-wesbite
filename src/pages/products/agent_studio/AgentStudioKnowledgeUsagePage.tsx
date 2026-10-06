import { PageHead } from '@components/common/PageHead';
import { UsageView } from '@/sections/pages/products/agent-studio/knowledge/UsageView';
import { DebugErrorBoundary } from '@/sections/pages/products/agent-studio/knowledge/debug/DebugErrorBoundary';

export default function AgentStudioKnowledgeUsagePage() {
  return (
    <>
      <PageHead
        title="Knowledge usage"
        description="Retrieval and citation activity across documents and agents."
        canonicalPath="/agent-studio/knowledge/usage"
      />
      <DebugErrorBoundary pageName="UsageView">
        <UsageView />
      </DebugErrorBoundary>
    </>
  );
}
