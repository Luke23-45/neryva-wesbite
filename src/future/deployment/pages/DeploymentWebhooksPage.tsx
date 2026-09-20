import { PageHead } from '@components/common/PageHead';
import { WebhooksView } from '../sections/webhooks';

export default function DeploymentWebhooksPage() {
  return (
    <>
      <PageHead
        title="Webhooks"
        description="Outbound HTTP callbacks for deployment, alert, and audit events."
        canonicalPath="/deployment/webhooks"
      />
      <WebhooksView />
    </>
  );
}

