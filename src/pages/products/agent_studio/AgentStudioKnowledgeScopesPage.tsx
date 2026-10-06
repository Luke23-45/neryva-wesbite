import { PageHead } from '@components/common/PageHead';
import { ScopesView } from '@/sections/pages/products/agent-studio/knowledge/ScopesView';

/** Page for /agent-studio/knowledge/scopes. */
export default function AgentStudioKnowledgeScopesPage() {
  return (
    <>
      <PageHead
        title="Knowledge scopes"
        description="Governed retrieval boundaries — attribute filters, pinned documents, and exclusions."
        canonicalPath="/agent-studio/knowledge/scopes"
      />
      <ScopesView />
    </>
  );
}
