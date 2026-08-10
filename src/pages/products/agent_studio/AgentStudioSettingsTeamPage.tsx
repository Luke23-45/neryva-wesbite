import { PageHead } from '@components/common/PageHead';
import { SettingsTeam } from '@/sections/pages/products/agent-studio/settings/tabs/SettingsTeam';

export default function AgentStudioSettingsTeamPage() {
  return (
    <>
      <PageHead
        title="Team"
        description="Manage members, roles, and invitations."
        canonicalPath="/agent-studio/settings/team"
      />
      <SettingsTeam />
    </>
  );
}
