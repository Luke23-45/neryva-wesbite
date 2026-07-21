import { PageHead } from '@components/common/PageHead';
import { DeploymentHero } from '@/sections/pages/products/deployment_temp/DeploymentHero';
import { DeploymentUseCases } from '@/sections/pages/products/deployment_temp/DeploymentUseCases';
import { DeploymentCapabilities } from '@/sections/pages/products/deployment_temp/DeploymentCapabilities';
import { DeploymentPipeline } from '@/sections/pages/products/deployment_temp/DeploymentPipeline';
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
      <DeploymentUseCases />
      <DeploymentCapabilities />
      <DeploymentPipeline />
    </>
  );
}
