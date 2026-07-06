import { PageHead } from '@components/common/PageHead';
import { EngineeringHero } from '@/sections/solutions/engineering/EngineeringHero';
import { EngineeringStandards } from '@/sections/solutions/engineering/EngineeringStandards';
import { EngineeringWorkflows } from '@/sections/solutions/engineering/EngineeringWorkflows';
import { EngineeringResearch } from '@/sections/solutions/engineering/EngineeringResearch';

export default function EngineeringPage() {
  return (
    <>
      <PageHead
        title="Engineering Systems AI"
        description="Intelligence for complex design and hardware lifecycles. Secure multi-modal AI for aerospace, automotive, and industrial design firms."
        canonicalPath="/solutions/engineering"
      />
      <EngineeringHero />
      <EngineeringStandards />
      <EngineeringWorkflows />
      <EngineeringResearch />
    </>
  );
}
