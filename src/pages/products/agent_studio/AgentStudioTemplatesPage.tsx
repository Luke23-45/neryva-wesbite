import { Outlet } from '@tanstack/react-router';
import { PageHead } from '@components/common/PageHead';
import { TemplatesView } from '@/sections/pages/products/agent-studio/templates';

export default function AgentStudioTemplatesPage() {
  return (
    <>
      <PageHead
        title="Templates"
        description="Pre-built agent templates for common use cases."
        canonicalPath="/agent-studio/templates"
      />
      <TemplatesView />
    </>
  );
}

/**
 * Layout for /agent-studio/templates — renders child routes
 * ($templateId/install) via the outlet.
 * Without this, TanStack Router drops every child route's component
 * (same class as A2-20).
 */
export function AgentStudioTemplatesLayout() {
  return <Outlet />;
}
