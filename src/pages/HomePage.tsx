import { Helmet } from 'react-helmet-async';
import { getSiteIdentity } from '@lib/data/site';
import { HomeHero } from '@/sections/home/HomeHero';
import { HomeResearch } from '@/sections/home/HomeResearch';
import { HomePrograms } from '@/sections/home/HomePrograms';
import { HomeLatestWork } from '@/sections/home/HomeLatestWork';
import { HomeContact } from '@/sections/home/HomeContact';

const identity = getSiteIdentity();

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>{identity.title}</title>
        <meta name="description" content={identity.description} />
      </Helmet>
      <HomeHero />
      <HomeResearch />
      <HomePrograms />
      <HomeLatestWork />
      <HomeContact />
    </>
  );
}
