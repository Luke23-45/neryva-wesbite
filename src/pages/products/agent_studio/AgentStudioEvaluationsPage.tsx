import { Outlet } from '@tanstack/react-router';
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

/**
 * Layout for /agent-studio/evaluations — renders the index and the dataset
 * cases-new section via the outlet. Without this, TanStack Router drops
 * every child route's component (same class as A2-20).
 */
export function AgentStudioEvaluationsLayout() {
  return <Outlet />;
}
