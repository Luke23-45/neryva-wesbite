import { PageHead } from '@components/common/PageHead';
import { StorageView } from '@/sections/pages/products/agent-studio/knowledge/StorageView';

export default function AgentStudioKnowledgeStoragePage() {
  return (
    <>
      <PageHead
        title="Storage"
        description="Quota usage and breakdowns for your knowledge base."
        canonicalPath="/agent-studio/knowledge/storage"
      />
      <StorageView />
    </>
  );
}
