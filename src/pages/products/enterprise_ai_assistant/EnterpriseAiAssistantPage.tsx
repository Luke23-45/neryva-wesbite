import { PageHead } from '@components/common/PageHead';
import { EnterpriseHero } from '@/sections/products/enterprise-ai-assistant/EnterpriseHero';
import { EnterprisePipeline } from '@/sections/products/enterprise-ai-assistant/EnterprisePipeline';

export default function EnterpriseAiAssistantPage() {
  return (
    <>
      <PageHead
        title="Neryva Enterprise Assistant"
        description="The secure AI interface for your organization. Deploy reasoning-driven assistants that execute workflows and resolve inquiries within your own infrastructure."
        canonicalPath="/products/enterprise-ai-assistant"
      />
      <EnterpriseHero />
      <EnterprisePipeline />
    </>
  );
}
