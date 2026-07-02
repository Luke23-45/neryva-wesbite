import { Helmet } from 'react-helmet-async';

interface PageHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
}

const SITE_NAME = 'Neryva Lab';
const BASE_URL = 'https://neryva.com';
const DEFAULT_DESCRIPTION = 'Neryva Lab — Advancing the science and engineering of large-scale AI systems.';

export function PageHead({ title, description, canonicalPath }: PageHeadProps) {
  const pageTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const canonical = canonicalPath ? `${BASE_URL}${canonicalPath}` : BASE_URL;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />

      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={desc} />
    </Helmet>
  );
}
