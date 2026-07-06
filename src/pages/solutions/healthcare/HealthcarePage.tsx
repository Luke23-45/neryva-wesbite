import { PageHead } from '@components/common/PageHead';
import { HealthcareHero } from '@/sections/solutions/healthcare/HealthcareHero';
import { HealthcareStandards } from '@/sections/solutions/healthcare/HealthcareStandards';
import { HealthcareWorkflows } from '@/sections/solutions/healthcare/HealthcareWorkflows';
import { HealthcareResearch } from '@/sections/solutions/healthcare/HealthcareResearch';

export default function HealthcarePage() {
  return (
    <>
      <PageHead
        title="Healthcare & Clinical AI"
        description="Intelligence for environments where accuracy is non-negotiable. Secure AI systems for hospitals, research institutions, and biotech firms."
        canonicalPath="/solutions/healthcare"
      />
      <HealthcareHero />
      <HealthcareStandards />
      <HealthcareWorkflows />
      <HealthcareResearch />
    </>
  );
}
