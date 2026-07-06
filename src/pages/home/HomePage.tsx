import { Helmet } from 'react-helmet-async';
import { getSiteIdentity } from '@lib/data/site';
import { HomeHero } from '@/sections/pages/home/HomeHero';
import { HomeProduct } from '@/sections/pages/home/HomeProduct';
import { HomeDeployment } from '@/sections/pages/home/HomeDeployment';
import { HomeResearch } from '@/sections/pages/home/HomeResearch';
import { HomePrograms } from '@/sections/pages/home/HomePrograms';
import { HomeLatestWork } from '@/sections/pages/home/HomeLatestWork';
import { HomeCta } from '@/sections/pages/home/HomeCta';

const identity = getSiteIdentity();

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>{identity.title}</title>
        <meta name="description" content={identity.description} />
      </Helmet>
      <HomeHero />
      <HomeProduct />
      <HomeDeployment />
      <HomeResearch />
      <HomePrograms />
      <HomeLatestWork />
      <HomeCta />
    </>
  );
}
