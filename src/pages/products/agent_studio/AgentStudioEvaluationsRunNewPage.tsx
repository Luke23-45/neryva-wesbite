import { PageHead } from '@components/common/PageHead';
import { RunNewSection } from '@/sections/pages/products/agent-studio/evaluations/RunNewSection';

export default function AgentStudioEvaluationsRunNewPage() {
  return (
    <>
      <PageHead
        title="Start eval run"
        description="Execute a published agent version against an eval dataset — lexical, state, and rubric scoring."
        canonicalPath="/agent-studio/evaluations/runs/new"
      />
      <RunNewSection />
    </>
  );
}
