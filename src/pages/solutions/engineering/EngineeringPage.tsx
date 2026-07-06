import { PageHead } from '@components/common/PageHead';
import { EngineeringHero } from '@/sections/pages/solutions/engineering/EngineeringHero';
import { EngineeringStandards } from '@/sections/pages/solutions/engineering/EngineeringStandards';
import { EngineeringWorkflows } from '@/sections/pages/solutions/engineering/EngineeringWorkflows';
import { EngineeringResearch } from '@/sections/pages/solutions/engineering/EngineeringResearch';

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
