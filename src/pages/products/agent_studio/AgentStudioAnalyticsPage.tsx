import { PageHead } from '@components/common/PageHead';
import { AnalyticsView } from '@/sections/pages/products/agent-studio/analytics';

export default function AgentStudioAnalyticsPage() {
  return (
    <>
      <PageHead
        title="Analytics"
        description="Metered usage, token consumption, and agent activity."
        canonicalPath="/agent-studio/analytics"
      />
      <AnalyticsView />
    </>
  );
}
