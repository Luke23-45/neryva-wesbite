import { PageHead } from '@components/common/PageHead';
import { ScopeBuilderView } from '@/sections/pages/products/agent-studio/knowledge/ScopeBuilderView';

/** Page for /agent-studio/knowledge/scopes/$slug/edit. */
export default function AgentStudioKnowledgeScopeEditPage() {
  return (
    <>
      <PageHead
        title="Edit knowledge scope"
        description="Update the scope's filters, pins, exclusions, and policies."
        canonicalPath="/agent-studio/knowledge/scopes/$slug/edit"
      />
      <ScopeBuilderView mode="edit" />
    </>
  );
}
