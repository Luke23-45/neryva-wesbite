import type { SiteIdentity, SeoDefaults } from '@types';
import identityData from '@data/site/identity.json';
import seoData from '@data/site/seo.json';

export function getSiteIdentity(): SiteIdentity {
  return identityData;
}

export function getSeoDefaults(): SeoDefaults {
  return seoData;
}
