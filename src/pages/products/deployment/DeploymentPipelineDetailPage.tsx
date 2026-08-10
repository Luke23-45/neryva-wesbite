import { PageHead } from '@components/common/PageHead';
import { PipelineDetailView } from '@/sections/pages/products/deployment/pipelines/detail';

export default function DeploymentPipelineDetailPage() {
  return (
    <>
      <PageHead
        title="Pipeline"
        description="View pipeline stages, configuration, and activity."
        canonicalPath="/deployment/pipelines"
      />
      <PipelineDetailView />
    </>
  );
}
