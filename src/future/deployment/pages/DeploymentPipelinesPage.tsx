import { PageHead } from '@components/common/PageHead';
import { PipelinesView } from '../sections/pipelines';

export default function DeploymentPipelinesPage() {
  return (
    <>
      <PageHead
        title="Pipelines"
        description="Track every stage of your deployment lifecycle — from architecture to operations."
        canonicalPath="/deployment/pipelines"
      />
      <PipelinesView />
    </>
  );
}

