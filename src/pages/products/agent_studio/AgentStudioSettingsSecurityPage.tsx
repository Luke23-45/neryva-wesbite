import { PageHead } from '@components/common/PageHead';
import { SettingsSecurity } from '@/sections/pages/products/agent-studio/settings/tabs/SettingsSecurity';

export default function AgentStudioSettingsSecurityPage() {
  return (
    <>
      <PageHead
        title="Security"
        description="Authentication, active sessions, and audit log."
        canonicalPath="/agent-studio/settings/security"
      />
      <SettingsSecurity />
    </>
  );
}
