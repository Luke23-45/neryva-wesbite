import { Helmet } from 'react-helmet-async';
import { ResourcesHero } from '@/sections/resources/ResourcesHero';
import { ResourcesWriting } from '@/sections/resources/ResourcesWriting';
import { ResourcesOpenSource } from '@/sections/resources/ResourcesOpenSource';
import { ResourcesReadingLists } from '@/sections/resources/ResourcesReadingLists';

export default function ResourcesPage() {
  return (
    <>
      <Helmet>
        <title>Resources — Neryva</title>
        <meta name="description" content="Technical writing, open source, and reading lists from Neryva." />
      </Helmet>
      <ResourcesHero />
      <ResourcesWriting />
      <ResourcesOpenSource />
      <ResourcesReadingLists />
    </>
  );
}
