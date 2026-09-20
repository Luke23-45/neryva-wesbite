import { PageHead } from '@components/common/PageHead';
import { AlertsView } from '../sections/alerts';

export default function DeploymentAlertsPage() {
  return (
    <>
      <PageHead
        title="Alerts"
        description="Active incidents, alert rules, and on-call rotations."
        canonicalPath="/deployment/alerts"
      />
      <AlertsView />
    </>
  );
}

