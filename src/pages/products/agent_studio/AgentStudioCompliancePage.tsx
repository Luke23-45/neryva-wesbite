import { Outlet } from '@tanstack/react-router';
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

/**
 * Layout for /agent-studio/compliance — renders child routes
 * (exports/new, holds/new, purges/new) via the outlet.
 * Without this, TanStack Router drops every child route's component
 * (same class as A2-20).
 */
export function AgentStudioComplianceLayout() {
  return <Outlet />;
}
