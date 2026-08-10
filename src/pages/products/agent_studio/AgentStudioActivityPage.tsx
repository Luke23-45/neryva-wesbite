import { PageHead } from '@components/common/PageHead';
import { ActivityView } from '@/sections/pages/products/agent-studio/activity';

export default function AgentStudioActivityPage() {
  return (
    <>
      <PageHead
        title="Activity"
        description="Every event across your agents — escalations, deploys, integrations, and more."
        canonicalPath="/agent-studio/activity"
      />
      <ActivityView />
    </>
  );
}
