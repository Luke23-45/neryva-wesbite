import { PageHead } from '@components/common/PageHead';
import { RecallGapsView } from '@/sections/pages/products/agent-studio/knowledge/RecallGapsView';

export default function AgentStudioKnowledgeRecallGapsPage() {
  return (
    <>
      <PageHead
        title="Recall gaps"
        description="Queries where retrieval failed to surface the right content."
        canonicalPath="/agent-studio/knowledge/recall-gaps"
      />
      <RecallGapsView />
    </>
  );
}
