import { PageHead } from '@components/common/PageHead';
import { CatalogPage } from '@/sections/pages/products/agent-studio/providers/pages/CatalogPage';

export default function AgentStudioProvidersCatalogPage() {
  return (
    <>
      <PageHead
        title="Providers · Catalog"
        description="Browse the model catalog by provider — pricing, context, capabilities, and access."
        canonicalPath="/agent-studio/providers/catalog"
      />
      <CatalogPage />
    </>
  );
}
