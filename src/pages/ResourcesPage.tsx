import { PageHead } from '@components/common/PageHead';
import { ResourcesHero } from '@/sections/resources/ResourcesHero';
import { ResourcesWriting } from '@/sections/resources/ResourcesWriting';
import { ResourcesOpenSource } from '@/sections/resources/ResourcesOpenSource';
import { ResourcesReadingLists } from '@/sections/resources/ResourcesReadingLists';

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
