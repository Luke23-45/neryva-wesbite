import { PageHead } from '@components/common/PageHead';
import { SettingsApiKeys } from '@/sections/pages/products/agent-studio/settings/tabs/SettingsApiKeys';

export default function AgentStudioSettingsApiKeysPage() {
  return (
    <>
      <PageHead
        title="API Keys"
        description="Create, manage, and revoke API keys for programmatic access."
        canonicalPath="/agent-studio/settings/api-keys"
      />
      <SettingsApiKeys />
    </>
  );
}
