import { PageHead } from '@components/common/PageHead';
import { DeploymentHero } from '@/sections/pages/products/deployment/DeploymentHero';
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
      <DeploymentPipeline />
    </>
  );
}
