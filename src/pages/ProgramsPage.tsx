import { Helmet } from 'react-helmet-async';
import { ProgramsHero } from '@/sections/programs/ProgramsHero';
import { ProgramsDirectory } from '@/sections/programs/ProgramsDirectory';

export default function ProgramsPage() {
  return (
    <>
      <Helmet>
        <title>Programs — Neryva</title>
        <meta name="description" content="Neryva's four research programs." />
      </Helmet>
      <ProgramsHero />
      <ProgramsDirectory />
    </>
  );
}
