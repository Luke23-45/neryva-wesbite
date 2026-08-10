import { PageHead } from '@components/common/PageHead';
import { AnalyticsView } from '@/sections/pages/products/agent-studio/analytics';

export default function AgentStudioAnalyticsPage() {
  return (
    <>
      <PageHead
        title="Analytics"
        description="Deep dive into agent performance, conversation channels, and regional usage."
        canonicalPath="/agent-studio/analytics"
      />
      <AnalyticsView />
    </>
  );
}
