import { PageHead } from '@components/common/PageHead';
import { LibrariesBlockNewSection } from '@/sections/pages/products/agent-studio/libraries/blocks/BlockNewSection';

export default function AgentStudioLibrariesBlocksNewPage() {
  return (
    <>
      <PageHead
        title="Set control block"
        description="Set a governance control block — refuses acceptance, assignment, tool calls, credentials, and installs."
        canonicalPath="/agent-studio/blocks/new"
      />
      <LibrariesBlockNewSection />
    </>
  );
}
