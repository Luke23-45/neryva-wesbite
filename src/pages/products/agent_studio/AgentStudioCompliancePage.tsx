import { PageHead } from '@components/common/PageHead';
import { ComplianceView } from '@/sections/pages/products/agent-studio/compliance';

export default function AgentStudioCompliancePage() {
  return (
    <>
      <PageHead
        title="Compliance"
        description="Certifications, controls, data residency, and audit log."
        canonicalPath="/agent-studio/compliance"
      />
      <ComplianceView />
    </>
  );
}
