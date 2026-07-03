import { PageHead } from '@components/common/PageHead';
import { useParams } from '@tanstack/react-router';
import styled from 'styled-components';
import { getProgramPage } from '@lib/data/programs';
import { TextLink } from '@/components/common/ui/TextLink';
import { ProgramDetailHero } from '@/sections/program-detail/ProgramDetailHero';
import { ProgramDetailOverview } from '@/sections/program-detail/ProgramDetailOverview';
import { ProgramDetailVectors } from '@/sections/program-detail/ProgramDetailVectors';
import { ProgramDetailWork } from '@/sections/program-detail/ProgramDetailWork';
import { ProgramDetailFoundations } from '@/sections/program-detail/ProgramDetailFoundations';

const NotFoundWrapper = styled.section`
  padding: 120px 0;
  text-align: center;
`;
const NotFoundTitle = styled.h1`
  font-size: 48px;
  font-weight: 500;
  margin-bottom: 16px;
`;

export default function ProgramDetailPage() {
  const { slug } = useParams({ from: '/programs/$slug' });
  const program = getProgramPage(slug);

  if (!program) {
    return (
      <NotFoundWrapper>
        <NotFoundTitle>Program not found</NotFoundTitle>
        <TextLink to="/programs">Back to Programs</TextLink>
      </NotFoundWrapper>
    );
  }

  return (
    <>
      <PageHead
        title={program.title}
        description={program.summary}
        canonicalPath={`/programs/${slug}`}
      />
      <ProgramDetailHero program={program} slug={slug} />
      <ProgramDetailOverview program={program} />
      <ProgramDetailVectors program={program} />
      <ProgramDetailWork program={program} />
      <ProgramDetailFoundations program={program} />
    </>
  );
}
