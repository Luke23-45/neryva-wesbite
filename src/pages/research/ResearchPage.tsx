import { PageHead } from '@components/common/PageHead';
import { ResearchHero } from '@/sections/pages/research/ResearchHero';
import { ResearchAreas } from '@/sections/pages/research/ResearchAreas';
import { ResearchPapers } from '@/sections/pages/research/ResearchPapers';

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
    </>
  );
}
