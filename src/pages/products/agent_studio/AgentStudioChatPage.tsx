import { PageHead } from '@components/common/PageHead';
import { AgentStudioChatView } from '@/sections/pages/products/agent-studio/chat';

export default function AgentStudioChatPage() {
  return (
    <>
      <PageHead
        title="Studio Chat"
        description="Compose, context, and converse — with tools, memory, and your agents attached."
        canonicalPath="/agent-studio/chat"
      />
      <AgentStudioChatView />
    </>
  );
}
