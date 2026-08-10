import { PageHead } from '@components/common/PageHead';
import { KnowledgeView } from '@/sections/pages/products/agent-studio/knowledge';

export default function AgentStudioKnowledgePage() {
  return (
    <>
      <PageHead
        title="Knowledge base"
        description="Manage the sources your agents reference to answer questions."
        canonicalPath="/agent-studio/knowledge"
      />
      <KnowledgeView />
    </>
  );
}
