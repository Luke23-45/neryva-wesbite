import { PageHead } from '@components/common/PageHead';
import { AboutHero } from '@/sections/pages/company/about/AboutHero';
import { AboutMission } from '@/sections/pages/company/about/AboutMission';
import { AboutTeam } from '@/sections/pages/company/about/AboutTeam';
import { AboutCTA } from '@/sections/pages/company/about/AboutCTA';
import companyHero from '@neryva_data/company/about/hero.json';
import companyMission from '@neryva_data/company/about/mission.json';
import companyTeam from '@neryva_data/company/about/team.json';
import companyCta from '@neryva_data/company/about/contact_cta.json';

export default function AboutPage() {
  return (
    <>
      <PageHead
        title="About"
        description="The mission and team of Neryva Lab."
        canonicalPath="/lab/about"
      />

      <main>
        <AboutHero data={{ label: companyHero.eyebrow, title: companyHero.headline, description: companyHero.description }} />
        <AboutMission data={companyMission} />
        <AboutTeam data={companyTeam} />
        <AboutCTA data={{ title: companyCta.title, description: companyCta.description, buttonText: companyCta.primaryCta.label, buttonLink: companyCta.primaryCta.href }} />
      </main>
    </>
  );
}
