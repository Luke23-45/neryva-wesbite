import { PageHead } from '@components/common/PageHead';
import { DeploymentHero } from '@/sections/pages/products/deployment/DeploymentHero';
import { DeploymentTypes } from '@/sections/pages/products/deployment/DeploymentTypes';
import { DeploymentCapabilities } from '@/sections/pages/products/deployment/DeploymentCapabilities';
import { DeploymentPipeline } from '@/sections/pages/products/deployment/DeploymentPipeline';
import heroData from '@neryva_data/products/deployment/section1_hero.json';

export default function AiEfficiencyDeploymentPage() {
  return (
    <>
      <PageHead
        title="Neryva AI Deployment"
        description={heroData.description}
        canonicalPath="/products/ai-efficiency-deployment"
      />
      <DeploymentHero />
      <DeploymentTypes />
      <DeploymentCapabilities />
      <DeploymentPipeline />
    </>
  );
}
