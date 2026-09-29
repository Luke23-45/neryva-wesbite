import { PageHead } from '@components/common/PageHead';
import { TemplateDetailSection } from '@/sections/pages/products/agent-studio/templates/TemplateDetailSection';

export default function AgentStudioTemplatesDetailPage() {
  return (
    <>
      <PageHead
        title="Template detail"
        description="Registry template contract — definition, required bindings, compatibility, evaluation, and release policy."
        canonicalPath="/agent-studio/templates/$templateId"
      />
      <TemplateDetailSection />
    </>
  );
}
