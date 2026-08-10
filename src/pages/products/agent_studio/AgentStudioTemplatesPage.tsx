import { PageHead } from '@components/common/PageHead';
import { TemplatesView } from '@/sections/pages/products/agent-studio/templates';

export default function AgentStudioTemplatesPage() {
  return (
    <>
      <PageHead
        title="Templates"
        description="Pre-built agent templates for common use cases."
        canonicalPath="/agent-studio/templates"
      />
      <TemplatesView />
    </>
  );
}
