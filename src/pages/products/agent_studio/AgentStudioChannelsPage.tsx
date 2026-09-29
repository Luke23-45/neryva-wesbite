import { Outlet } from '@tanstack/react-router';
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

/**
 * Layout for /agent-studio/channels — renders child routes (connect,
 * $accountId, $accountId/webhook-setup) via the outlet. Without this,
 * TanStack Router drops every child route's component (same class as A2-20).
 */
export function AgentStudioChannelsLayout() {
  return <Outlet />;
}
