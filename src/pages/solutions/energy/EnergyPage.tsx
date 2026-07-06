import { PageHead } from '@components/common/PageHead';
import { EnergyHero } from '@/sections/solutions/energy/EnergyHero';
import { EnergyStandards } from '@/sections/solutions/energy/EnergyStandards';
import { EnergyWorkflows } from '@/sections/solutions/energy/EnergyWorkflows';
import { EnergyResearch } from '@/sections/solutions/energy/EnergyResearch';

export default function EnergyPage() {
  return (
    <>
      <PageHead
        title="Energy & Infrastructure AI"
        description="Intelligence for critical energy operations. Deploy secure AI systems for grid operators, renewable networks, and industrial energy firms."
        canonicalPath="/solutions/energy"
      />
      <EnergyHero />
      <EnergyStandards />
      <EnergyWorkflows />
      <EnergyResearch />
    </>
  );
}
