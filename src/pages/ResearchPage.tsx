import { Helmet } from 'react-helmet-async';
import { ResearchHero } from '@/sections/research/ResearchHero';
import { ResearchAreas } from '@/sections/research/ResearchAreas';
import { ResearchPapers } from '@/sections/research/ResearchPapers';
import { ResearchOpenProblems } from '@/sections/research/ResearchOpenProblems';

export default function ResearchPage() {
  return (
    <>
      <Helmet>
        <title>Research — Neryva</title>
        <meta name="description" content="Neryva's research agenda: efficiency, stability, and deployability of large-scale AI systems." />
      </Helmet>
      <ResearchHero />
      <ResearchAreas />
      <ResearchPapers />
      <ResearchOpenProblems />
    </>
  );
}
