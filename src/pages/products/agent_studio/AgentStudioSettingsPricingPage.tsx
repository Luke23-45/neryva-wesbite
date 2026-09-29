import { PageHead } from '@components/common/PageHead';
import { SettingsPricing } from '@/sections/pages/products/agent-studio/settings/tabs/SettingsPricing';

export default function AgentStudioSettingsPricingPage() {
  return (
    <>
      <PageHead
        title="Pricing"
        description="Simple, usage-based pricing. 1 credit = $0.01 USD, always."
        canonicalPath="/agent-studio/settings/pricing"
      />
      <SettingsPricing />
    </>
  );
}
