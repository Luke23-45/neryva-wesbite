import { PageHead } from '@components/common/PageHead';
import { HealthView } from '@/sections/pages/products/agent-studio/knowledge/HealthView';
import { DebugErrorBoundary } from '@/sections/pages/products/agent-studio/knowledge/debug/DebugErrorBoundary';

export default function AgentStudioKnowledgeHealthPage() {
  return (
    <>
      <PageHead
        title="Knowledge health"
        description="Open findings from library health checks — quota, sessions, drift."
        canonicalPath="/agent-studio/knowledge/health"
      />
      <DebugErrorBoundary pageName="HealthView">
        <HealthView />
      </DebugErrorBoundary>
    </>
  );
}
