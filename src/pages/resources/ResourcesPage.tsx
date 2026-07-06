import { PageHead } from '@components/common/PageHead';
import { ResourcesHero } from '@/sections/resources/page_section/ResourcesHero';
import { ResourcesWriting } from '@/sections/resources/page_section/ResourcesWriting';
import { ResourcesOpenSource } from '@/sections/resources/page_section/ResourcesOpenSource';
import { ResourcesReadingLists } from '@/sections/resources/page_section/ResourcesReadingLists';

export default function ResourcesPage() {
  return (
    <>
      <PageHead
        title="Resources"
        description="Technical writing, open source, and reading lists from Neryva."
        canonicalPath="/resources"
      />
      <ResourcesHero />
      <ResourcesWriting />
      <ResourcesOpenSource />
      <ResourcesReadingLists />
    </>
  );
}
