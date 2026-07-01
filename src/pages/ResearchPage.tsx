import { PageHead } from '@components/common/PageHead';
import { ResearchHero } from '@/sections/research/ResearchHero';
import { ResearchAreas } from '@/sections/research/ResearchAreas';
import { ResearchPapers } from '@/sections/research/ResearchPapers';
import { ResearchOpenProblems } from '@/sections/research/ResearchOpenProblems';

export default function ResearchPage() {
  return (
    <>
      <PageHead
        title="Research"
        description="Neryva's research agenda: efficiency, stability, and deployability of large-scale AI systems."
        canonicalPath="/research"
      />
      <ResearchHero />
      <ResearchAreas />
      <ResearchPapers />
      <ResearchOpenProblems />
    </>
  );
}
