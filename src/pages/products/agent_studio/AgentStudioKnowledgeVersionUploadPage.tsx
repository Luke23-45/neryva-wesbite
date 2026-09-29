import { PageHead } from '@components/common/PageHead';
import { VersionUploadSection } from '@/sections/pages/products/agent-studio/knowledge/VersionUploadSection';

/**
 * Page for /agent-studio/knowledge/$docId/versions/upload. The knowledge
 * route layout (AgentStudioKnowledgeLayout) already mounts
 * KnowledgeUploadsProvider around the outlet, so the section shares the
 * library's upload-tracker instance — no second provider here (a nested one
 * would shadow the layout's and orphan in-flight polls on navigation back).
 */
export default function AgentStudioKnowledgeVersionUploadPage() {
  return (
    <>
      <PageHead
        title="Upload new version"
        description="Append a version to a knowledge document — the pin address stays the same; agents resolve the latest version at next publish."
        canonicalPath="/agent-studio/knowledge/$docId/versions/upload"
      />
      <VersionUploadSection />
    </>
  );
}
