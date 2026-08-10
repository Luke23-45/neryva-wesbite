import { PageHead } from '@components/common/PageHead';
import { ReleasesView } from '@/sections/pages/products/deployment/releases';

export default function DeploymentReleasesPage() {
  return (
    <>
      <PageHead
        title="Releases"
        description="Release history, changelogs, and rollout metrics across every deployment."
        canonicalPath="/deployment/releases"
      />
      <ReleasesView />
    </>
  );
}
