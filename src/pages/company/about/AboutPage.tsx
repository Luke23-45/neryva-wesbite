import { PageHead } from '@components/common/PageHead';
import { AboutHero } from '@/sections/pages/company/about/AboutHero';
import { AboutMission } from '@/sections/pages/company/about/AboutMission';
import { AboutTeam } from '@/sections/pages/company/about/AboutTeam';
import { AboutCTA } from '@/sections/pages/company/about/AboutCTA';
import aboutData from '@data/pages/about.json';

export default function AboutPage() {
  return (
    <>
      <PageHead
        title="About"
        description="The mission and team of Neryva Lab."
        canonicalPath="/lab/about"
      />

      <main>
        <AboutHero data={aboutData.hero} />
        <AboutMission data={aboutData.mission} />
        <AboutTeam data={aboutData.team} />
        <AboutCTA data={aboutData.cta} />
      </main>
    </>
  );
}
