import { PageHead } from '@components/common/PageHead';
import { SettingsBilling } from '@/sections/pages/products/agent-studio/settings/tabs/SettingsBilling';

export default function AgentStudioSettingsBillingPage() {
  return (
    <>
      <PageHead
        title="Billing"
        description="Plan, usage, and invoices."
        canonicalPath="/agent-studio/settings/billing"
      />
      <SettingsBilling />
    </>
  );
}
