import { PageHead } from '@components/common/PageHead';
import { ExportNewSection } from '@/sections/pages/products/agent-studio/compliance/ExportNewSection';

export default function AgentStudioComplianceExportsNewPage() {
  return (
    <>
      <PageHead
        title="Request a data export"
        description="Pick up to 20 recent conversations to include in a DSR export archive."
        canonicalPath="/agent-studio/compliance/exports/new"
      />
      <ExportNewSection />
    </>
  );
}
