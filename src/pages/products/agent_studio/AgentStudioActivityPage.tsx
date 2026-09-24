import { PageHead } from '@components/common/PageHead';
import { ActivityView } from '@/sections/pages/products/agent-studio/activity';

export default function AgentStudioActivityPage() {
  return (
    <>
      <PageHead
        title="Activity"
        description="The organization's hash-chained audit trail — logins, publishes, key operations, and privileged actions."
        canonicalPath="/agent-studio/activity"
      />
      <ActivityView />
    </>
  );
}
