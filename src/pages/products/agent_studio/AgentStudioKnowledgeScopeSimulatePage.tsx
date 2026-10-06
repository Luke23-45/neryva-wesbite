import { PageHead } from '@components/common/PageHead';
import { ScopeSimulateView } from '@/sections/pages/products/agent-studio/knowledge/ScopeSimulateView';

/** Page for /agent-studio/knowledge/scopes/$slug/simulate. */
export default function AgentStudioKnowledgeScopeSimulatePage() {
  return (
    <>
      <PageHead
        title="Simulate scope retrieval"
        description="Run the retrieval pipeline constrained to this scope — configuration by observation."
        canonicalPath="/agent-studio/knowledge/scopes/$slug/simulate"
      />
      <ScopeSimulateView />
    </>
  );
}
