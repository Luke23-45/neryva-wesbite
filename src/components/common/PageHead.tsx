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
    /* defer={false}: react-helmet-async defers DOM updates via
       requestAnimationFrame by default, which leaves the document title
       showing the previous route's title until a later frame — the title
       must update synchronously with the route change. */
    <Helmet defer={false}>
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
