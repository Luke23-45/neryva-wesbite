import { PageHead } from '@components/common/PageHead';
import { HealthView } from '@/sections/pages/products/agent-studio/knowledge/HealthView';

export default function AgentStudioKnowledgeHealthPage() {
  return (
    <>
      <PageHead
        title="Knowledge health"
        description="Open findings from library health checks — quota, sessions, drift."
        canonicalPath="/agent-studio/knowledge/health"
      />
      <HealthView />
    </>
  );
}
