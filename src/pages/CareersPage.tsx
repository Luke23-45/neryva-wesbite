import { Helmet } from 'react-helmet-async';
import { CareersHero } from '@/sections/careers/CareersHero';
import { CareersEnvironment } from '@/sections/careers/CareersEnvironment';
import { CareersRoles } from '@/sections/careers/CareersRoles';
import careersData from '@data/pages/careers.json';

export default function CareersPage() {
  return (
    <>
      <Helmet>
        <title>Careers at Neryva</title>
        <meta
          name="description"
          content="Join Neryva Lab. We are looking for exceptional researchers, engineers, and operators."
        />
      </Helmet>
      
      <main>
        <CareersHero data={careersData.hero} />
        <CareersEnvironment data={careersData.environment} />
        <CareersRoles data={careersData.roles} />
      </main>
    </>
  );
}
