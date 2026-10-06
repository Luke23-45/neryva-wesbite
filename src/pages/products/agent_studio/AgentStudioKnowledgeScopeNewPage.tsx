import { PageHead } from '@components/common/PageHead';
import { ScopeBuilderView } from '@/sections/pages/products/agent-studio/knowledge/ScopeBuilderView';

/** Page for /agent-studio/knowledge/scopes/new. */
export default function AgentStudioKnowledgeScopeNewPage() {
  return (
    <>
      <PageHead
        title="New knowledge scope"
        description="Define a governed retrieval boundary for your agents."
        canonicalPath="/agent-studio/knowledge/scopes/new"
      />
      <ScopeBuilderView mode="new" />
    </>
  );
}
