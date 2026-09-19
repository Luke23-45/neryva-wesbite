import { PageHead } from '@components/common/PageHead';
import { ApprovalsView } from '@/sections/pages/products/agent-studio/approvals';

export default function AgentStudioApprovalsPage() {
  return (
    <>
      <PageHead
        title="Approvals"
        description="Review approval-gated tool calls — approve to re-drive runs, deny to cancel them."
        canonicalPath="/agent-studio/approvals"
      />
      <ApprovalsView />
    </>
  );
}
