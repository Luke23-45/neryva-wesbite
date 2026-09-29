import { PageHead } from '@components/common/PageHead';
import { PurgeNewSection } from '@/sections/pages/products/agent-studio/compliance/PurgeNewSection';

export default function AgentStudioCompliancePurgesNewPage() {
  return (
    <>
      <PageHead
        title="Request a purge"
        description="Enqueue a multi-step purge for a conversation. Legal holds block it."
        canonicalPath="/agent-studio/compliance/purges/new"
      />
      <PurgeNewSection />
    </>
  );
}
