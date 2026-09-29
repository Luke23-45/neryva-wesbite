import { Outlet } from '@tanstack/react-router';
import { PageHead } from '@components/common/PageHead';
import { UploadSection } from '@/sections/pages/products/agent-studio/knowledge/UploadSection';
import { KnowledgeUploadsProvider } from '@/sections/pages/products/agent-studio/knowledge/KnowledgeUploads';

export default function AgentStudioKnowledgeUploadPage() {
  return (
    <>
      <PageHead
        title="Upload documents"
        description="Authorize upload sessions for files or pasted text — each session is tracked to READY on the knowledge library."
        canonicalPath="/agent-studio/knowledge/upload"
      />
      <UploadSection />
    </>
  );
}

/**
 * Layout for /agent-studio/knowledge — mounts the shared attachment-upload
 * instance (KnowledgeUploadsProvider) around the outlet so the library and
 * the upload section poll the same tracker rows (A4-02). Without this,
 * TanStack Router drops every child route's component (same class as
 * A2-20) and the section would orphan in-flight uploads on navigation.
 */
export function AgentStudioKnowledgeLayout() {
  return (
    <KnowledgeUploadsProvider>
      <Outlet />
    </KnowledgeUploadsProvider>
  );
}
