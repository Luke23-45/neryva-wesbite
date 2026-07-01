import { Helmet } from 'react-helmet-async';
import { AboutHero } from '@/sections/about/AboutHero';
import { AboutPrinciples } from '@/sections/about/AboutPrinciples';
import { AboutStructure } from '@/sections/about/AboutStructure';
import { AboutCTA } from '@/sections/about/AboutCTA';
import aboutData from '@data/pages/about.json';

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Neryva Lab</title>
        <meta
          name="description"
          content="The charter, operating principles, and structure of Neryva Lab."
        />
      </Helmet>
      
      <main>
        <AboutHero data={aboutData.hero} />
        <AboutPrinciples data={aboutData.principles} />
        <AboutStructure data={aboutData.structure} />
        <AboutCTA data={aboutData.cta} />
      </main>
    </>
  );
}
