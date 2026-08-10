import { PageHead } from '@components/common/PageHead';
import { SettingsProfile } from '@/sections/pages/products/agent-studio/settings/tabs/SettingsProfile';

export default function AgentStudioSettingsProfilePage() {
  return (
    <>
      <PageHead
        title="Profile"
        description="Your personal account details and preferences."
        canonicalPath="/agent-studio/settings/profile"
      />
      <SettingsProfile />
    </>
  );
}
