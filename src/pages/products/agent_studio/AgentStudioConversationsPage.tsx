import { PageHead } from '@components/common/PageHead';
import { ConversationsView } from '@/sections/pages/products/agent-studio/conversations';

export default function AgentStudioConversationsPage() {
  return (
    <>
      <PageHead
        title="Conversations"
        description="Review transcripts, escalations, and outcomes from every customer interaction."
        canonicalPath="/agent-studio/conversations"
      />
      <ConversationsView />
    </>
  );
}
