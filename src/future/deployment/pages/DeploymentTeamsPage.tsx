import { PageHead } from '@components/common/PageHead';
import { TeamsView } from '../sections/teams';

export default function DeploymentTeamsPage() {
  return (
    <>
      <PageHead
        title="Teams"
        description="Workspace members, RBAC matrix, service accounts, and API tokens for deployments."
        canonicalPath="/deployment/teams"
      />
      <TeamsView />
    </>
  );
}

