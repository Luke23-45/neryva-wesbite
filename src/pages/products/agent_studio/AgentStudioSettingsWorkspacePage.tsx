import { PageHead } from '@components/common/PageHead';
import { SettingsWorkspace } from '@/sections/pages/products/agent-studio/settings/tabs/SettingsWorkspace';

export default function AgentStudioSettingsWorkspacePage() {
  return (
    <>
      <PageHead
        title="Workspace"
        description="Workspace identity, branding, and defaults."
        canonicalPath="/agent-studio/settings/workspace"
      />
      <SettingsWorkspace />
    </>
  );
}
