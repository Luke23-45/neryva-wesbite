import { PageHead } from '@components/common/PageHead';
import { ConnectSection } from '@/sections/pages/products/agent-studio/channels/ConnectSection';

export default function AgentStudioChannelsConnectPage() {
  return (
    <>
      <PageHead
        title="Connect a channel"
        description="Connect WhatsApp, Messenger, Telegram, or the website widget."
        canonicalPath="/agent-studio/channels/connect"
      />
      <ConnectSection />
    </>
  );
}
