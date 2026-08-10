import { PageHead } from '@components/common/PageHead';
import { ComplianceView } from '@/sections/pages/products/deployment/compliance';

export default function DeploymentCompliancePage() {
  return (
    <>
      <PageHead
        title="Compliance"
        description="Certifications, deployment controls, regional data residency, and audit log."
        canonicalPath="/deployment/compliance"
      />
      <ComplianceView />
    </>
  );
}
