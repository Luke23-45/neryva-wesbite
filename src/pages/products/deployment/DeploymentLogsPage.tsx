import { PageHead } from '@components/common/PageHead';
import { LogsView } from '@/sections/pages/products/deployment/logs';

export default function DeploymentLogsPage() {
  return (
    <>
      <PageHead
        title="Logs"
        description="Live deployment logs across all regions and runtimes."
        canonicalPath="/deployment/logs"
      />
      <LogsView />
    </>
  );
}
