import { PageHead } from '@components/common/PageHead';
import { SpendPage } from '@/sections/pages/products/agent-studio/providers/pages/SpendPage';

export default function AgentStudioProvidersSpendPage() {
  return (
    <>
      <PageHead
        title="Providers · Spend & Budgets"
        description="Model spend by key and by model, with budget caps and breach controls."
        canonicalPath="/agent-studio/providers/spend"
      />
      <SpendPage />
    </>
  );
}
