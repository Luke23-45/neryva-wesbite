import { PageHead } from '@components/common/PageHead';
import { BlocksView } from '@/sections/pages/products/agent-studio/libraries/blocks/BlocksView';

export default function AgentStudioBlocksPage() {
  return (
    <>
      <PageHead
        title="Blocks"
        description="Governance kill switches with expiry — what they refuse and why."
        canonicalPath="/agent-studio/blocks"
      />
      <BlocksView />
    </>
  );
}
