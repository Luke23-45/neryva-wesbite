import { PageHead } from '@components/common/PageHead';
import { DashboardView } from '@/sections/pages/products/agent-studio/dashboard';

export default function AgentStudioDashboardPage() {
  return (
    <>
      <PageHead
        title="Dashboard"
        description="Monitor your agent studio at a glance — usage, performance, and live activity."
        canonicalPath="/agent-studio/dashboard"
      />
      <DashboardView />
    </>
  );
}
