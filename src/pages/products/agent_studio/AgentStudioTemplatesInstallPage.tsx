import { PageHead } from '@components/common/PageHead';
import { InstallSection } from '@/sections/pages/products/agent-studio/templates/InstallSection';

export default function AgentStudioTemplatesInstallPage() {
  return (
    <>
      <PageHead
        title="Install template"
        description="Install a registry template as a draft — one transaction copies it into a fresh assistant; nothing goes live."
        canonicalPath="/agent-studio/templates/$templateId/install"
      />
      <InstallSection />
    </>
  );
}
