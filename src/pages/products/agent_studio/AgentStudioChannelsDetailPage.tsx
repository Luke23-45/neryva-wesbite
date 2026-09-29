import { PageHead } from '@components/common/PageHead';
import { ChannelDetailSection } from '@/sections/pages/products/agent-studio/channels/ChannelDetailSection';

export default function AgentStudioChannelsDetailPage() {
  return (
    <>
      <PageHead
        title="Channel settings"
        description="Configure the channel account: binding, messaging extras, credentials, and danger zone."
        canonicalPath="/agent-studio/channels/$accountId"
      />
      <ChannelDetailSection />
    </>
  );
}
