import { PageHead } from '@components/common/PageHead';
import { TwoFactorSetupSection } from '@/sections/pages/products/agent-studio/settings/TwoFactorSetupSection';

export default function AgentStudioSettingsTwoFactorSetupPage() {
  return (
    <>
      <PageHead
        title="Set up two-factor authentication"
        description="Pair an authenticator app and save your recovery codes."
        canonicalPath="/agent-studio/settings/security/two-factor/setup"
      />
      <TwoFactorSetupSection />
    </>
  );
}
