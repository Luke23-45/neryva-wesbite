import { PageHead } from '@components/common/PageHead';
import { ServiceAccountCreateSection } from '@/sections/pages/products/agent-studio/teams/ServiceAccountCreateSection';

export default function AgentStudioTeamsServiceAccountNewPage() {
  return (
    <>
      <PageHead
        title="New service account"
        description="Create a machine account for CI and integrations."
        canonicalPath="/agent-studio/teams/service-accounts/new"
      />
      <ServiceAccountCreateSection />
    </>
  );
}
