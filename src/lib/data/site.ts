import type { SiteIdentity, SeoDefaults } from '@types';
import identityData from '@neryva_data/common/site_identity.json';
import seoData from '@neryva_data/common/seo.json';

export function getSiteIdentity(): SiteIdentity {
  return identityData;
}

export function getSeoDefaults(): SeoDefaults {
  return seoData;
}
