import { PageHead } from '@components/common/PageHead';
import { DeploymentHero } from '@/sections/products/deployment/DeploymentHero';
import { DeploymentLifecycle } from '@/sections/products/deployment/DeploymentLifecycle';
import { DeploymentPerformance } from '@/sections/products/deployment/DeploymentPerformance';
import { DeploymentTopologies } from '@/sections/products/deployment/DeploymentTopologies';
import { DeploymentArtifacts } from '@/sections/products/deployment/DeploymentArtifacts';
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
