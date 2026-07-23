import { PageHead } from '@components/common/PageHead';
import { CareersHero } from '@/sections/pages/company/careers/CareersHero';
import { CareersEnvironment } from '@/sections/pages/company/careers/CareersEnvironment';
import { CareersRoles } from '@/sections/pages/company/careers/CareersRoles';
import careersData from '@neryva_data/company/careers/careers.json';

export default function CareersPage() {
  return (
    <>
      <PageHead
        title="Careers"
        description="Join Neryva Lab. We are looking for exceptional researchers, engineers, and operators."
        canonicalPath="/lab/careers"
      />

      <main>
        <CareersHero data={careersData.hero} />
        <CareersEnvironment data={careersData.environment} />
        <CareersRoles data={careersData.roles} />
      </main>
    </>
  );
}
