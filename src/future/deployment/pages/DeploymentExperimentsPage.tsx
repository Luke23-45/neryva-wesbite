import { PageHead } from '@components/common/PageHead';
import { ExperimentsView } from '../sections/experiments';

export default function DeploymentExperimentsPage() {
  return (
    <>
      <PageHead
        title="Experiments"
        description="A/B tests, canaries, and champion/challenger rollouts with significance tracking."
        canonicalPath="/deployment/experiments"
      />
      <ExperimentsView />
    </>
  );
}

