import { PageHead } from '@components/common/PageHead';
import { ScopeBuilderView } from '@/sections/pages/products/agent-studio/knowledge/ScopeBuilderView';
import { DebugErrorBoundary } from '@/sections/pages/products/agent-studio/knowledge/debug/DebugErrorBoundary';

/** Page for /agent-studio/knowledge/scopes/new. */
export default function AgentStudioKnowledgeScopeNewPage() {
  return (
    <>
      <PageHead
        title="New knowledge scope"
        description="Define a governed retrieval boundary for your agents."
        canonicalPath="/agent-studio/knowledge/scopes/new"
      />
      <div style={{ background: 'yellow', padding: 8, textAlign: 'center', fontWeight: 'bold' }}>
        DEBUG CODE LIVE — 0d217f3
      </div>
      <DebugErrorBoundary pageName="ScopeBuilderView">
        <ScopeBuilderView mode="new" />
      </DebugErrorBoundary>
    </>
  );
}
