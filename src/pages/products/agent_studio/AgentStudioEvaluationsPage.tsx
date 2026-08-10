import { PageHead } from '@components/common/PageHead';
import { EvaluationsView } from '@/sections/pages/products/agent-studio/evaluations';

export default function AgentStudioEvaluationsPage() {
  return (
    <>
      <PageHead
        title="Evaluations"
        description="Regression suites, benchmarks, and safety checks for production agents."
        canonicalPath="/agent-studio/evaluations"
      />
      <EvaluationsView />
    </>
  );
}
