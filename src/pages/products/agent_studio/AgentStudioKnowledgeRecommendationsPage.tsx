import { PageHead } from '@components/common/PageHead';
import { RecommendationsView } from '@/sections/pages/products/agent-studio/knowledge/RecommendationsView';

export default function AgentStudioKnowledgeRecommendationsPage() {
  return (
    <>
      <PageHead
        title="Recommendations"
        description="Automated suggestions from usage, quality, and gap analysis."
        canonicalPath="/agent-studio/knowledge/recommendations"
      />
      <RecommendationsView />
    </>
  );
}
