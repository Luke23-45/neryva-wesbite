import { PageHead } from '@components/common/PageHead';
import { DeploymentHero } from '@/sections/pages/products/deployment/DeploymentHero';
import { DeploymentLifecycle } from '@/sections/pages/products/deployment/DeploymentLifecycle';
import { DeploymentPerformance } from '@/sections/pages/products/deployment/DeploymentPerformance';
import { DeploymentTopologies } from '@/sections/pages/products/deployment/DeploymentTopologies';
import { DeploymentArtifacts } from '@/sections/pages/products/deployment/DeploymentArtifacts';
import heroData from '@neryva_data/products/deployment/section1_hero.json';

export default function AiEfficiencyDeploymentPage() {
  return (
    <>
      <PageHead
        title="Neryva AI Efficiency & Deployment"
        description={heroData.description}
        canonicalPath="/products/ai-efficiency-deployment"
      />
      <DeploymentHero />
      <DeploymentLifecycle />
      <DeploymentPerformance />
      <DeploymentTopologies />
      <DeploymentArtifacts />
    </>
  );
}
