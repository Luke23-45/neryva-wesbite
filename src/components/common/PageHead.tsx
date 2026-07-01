import { Helmet } from 'react-helmet-async';
import seo from '@data/site/seo.json';
import identity from '@data/site/identity.json';

interface PageHeadProps {
  /** Page-specific title. Will be formatted as "{title} — Neryva". Omit for the default site title. */
  title?: string;
  /** Page-specific description. Falls back to the global default from seo.json. */
  description?: string;
  /** Absolute URL path of the canonical page, e.g. "/research". Prepended with baseUrl automatically. */
  canonicalPath?: string;
  /** Override the social card image path (relative to public/, must start with /). */
  socialImage?: string;
  /** Structured data (JSON-LD) to inject into a <script type="application/ld+json"> tag. */
  structuredData?: Record<string, unknown>;
}

/**
 * PageHead — global SEO + social meta component.
 *
 * Drop this into any page as the first child to set:
 *  - <title>
 *  - meta description
 *  - canonical link
 *  - Open Graph tags (og:title, og:description, og:image, og:url, og:type, og:site_name)
 *  - Twitter Card tags
 *  - Structured data (JSON-LD) — optional
 *
 * All values fall back to site-wide defaults from `data/site/seo.json`
 * and `data/site/identity.json` when not explicitly provided.
 *
 * @example
 * // With page-specific values:
 * <PageHead
 *   title="Research"
 *   description="Neryva's research agenda: efficiency, stability, and deployability."
 *   canonicalPath="/research"
 * />
 *
 * @example
 * // Homepage (uses all defaults):
 * <PageHead />
 */
export function PageHead({
  title,
  description,
  canonicalPath,
  socialImage,
  structuredData,
}: PageHeadProps) {
  const resolvedTitle = title
    ? seo.titleTemplate.replace('%s', title)
    : seo.defaultTitle;

  const resolvedDescription = description ?? seo.defaultDescription;
  const resolvedSocialImage = socialImage ?? seo.socialImage;
  const resolvedCanonical = canonicalPath
    ? `${identity.baseUrl}${canonicalPath}`
    : identity.baseUrl;

  const absoluteSocialImage = resolvedSocialImage.startsWith('http')
    ? resolvedSocialImage
    : `${identity.baseUrl}${resolvedSocialImage}`;

  return (
    <Helmet>
      {/* ── Primary ──────────────────────────────────── */}
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <link rel="canonical" href={resolvedCanonical} />

      {/* ── Open Graph ───────────────────────────────── */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={identity.name} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:image" content={absoluteSocialImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${identity.name} — ${resolvedTitle}`} />

      {/* ── Twitter Card ─────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={absoluteSocialImage} />
      <meta name="twitter:image:alt" content={`${identity.name} — ${resolvedTitle}`} />

      {/* ── Structured Data (JSON-LD) ─────────────────── */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
