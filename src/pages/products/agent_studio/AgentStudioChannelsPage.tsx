import { PageHead } from '@components/common/PageHead';
import { ChannelsView } from '@/sections/pages/products/agent-studio/channels';

export default function AgentStudioChannelsPage() {
  return (
    <>
      <PageHead
        title="Channels"
        description="Connect WhatsApp, Messenger, Telegram, and the website widget — bind the assistant that serves each."
        canonicalPath="/agent-studio/channels"
      />
      <ChannelsView />
    </>
  );
}
