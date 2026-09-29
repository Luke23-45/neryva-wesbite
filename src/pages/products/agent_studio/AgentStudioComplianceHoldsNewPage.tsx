import { PageHead } from '@components/common/PageHead';
import { HoldNewSection } from '@/sections/pages/products/agent-studio/compliance/HoldNewSection';

export default function AgentStudioComplianceHoldsNewPage() {
  return (
    <>
      <PageHead
        title="Place a legal hold"
        description="Place a legal hold on a conversation or the whole organization. Owner/admin only."
        canonicalPath="/agent-studio/compliance/holds/new"
      />
      <HoldNewSection />
    </>
  );
}
