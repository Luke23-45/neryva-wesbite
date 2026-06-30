import { Helmet } from 'react-helmet-async';
import { LabHero } from '@/sections/lab/LabHero';
import { LabMission } from '@/sections/lab/LabMission';
import { LabTeam } from '@/sections/lab/LabTeam';
import { LabValues } from '@/sections/lab/LabValues';

export default function LabPage() {
  return (
    <>
      <Helmet>
        <title>Lab — Neryva</title>
        <meta name="description" content="About Neryva: our mission, team, and research values." />
      </Helmet>
      <LabHero />
      <LabMission />
      <LabTeam />
      <LabValues />
    </>
  );
}
