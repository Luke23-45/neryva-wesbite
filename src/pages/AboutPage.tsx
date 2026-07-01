import { PageHead } from '@components/common/PageHead';
import { AboutHero } from '@/sections/about/AboutHero';
import { AboutPrinciples } from '@/sections/about/AboutPrinciples';
import { AboutStructure } from '@/sections/about/AboutStructure';
import { AboutCTA } from '@/sections/about/AboutCTA';
import aboutData from '@data/pages/about.json';

export default function AboutPage() {
  return (
    <>
      <PageHead
        title="About"
        description="The charter, operating principles, and structure of Neryva Lab."
        canonicalPath="/lab/about"
      />

      <main>
        <AboutHero data={aboutData.hero} />
        <AboutPrinciples data={aboutData.principles} />
        <AboutStructure data={aboutData.structure} />
        <AboutCTA data={aboutData.cta} />
      </main>
    </>
  );
}
