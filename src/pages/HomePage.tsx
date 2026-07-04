import { Helmet } from 'react-helmet-async';
import { getSiteIdentity } from '@lib/data/site';
import { HomeHero } from '@/sections/home/HomeHero';
import { HomeProduct } from '@/sections/home/HomeProduct';
import { HomeDeployment } from '@/sections/home/HomeDeployment';
import { HomeResearch } from '@/sections/home/HomeResearch';
import { HomePrograms } from '@/sections/home/HomePrograms';
import { HomeLatestWork } from '@/sections/home/HomeLatestWork';
import { HomeCta } from '@/sections/home/HomeCta';

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
