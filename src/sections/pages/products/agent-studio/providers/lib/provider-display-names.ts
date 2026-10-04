/**
 * Providers — canonical client-side display names for provider slugs.
 *
 * Single source of truth for KeyCard and MyProvidersPage (no drift). The
 * engine serves `provider_display_name` on `ProviderCredentialView`; this
 * map is the fallback for older engines and for slugs the engine does not
 * know. Unknown slugs fall back to title-case — never an invented brand.
 */

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  azure: 'Azure',
  custom: 'Custom',
};

/** Display name for a provider slug. Unknown slugs → title-cased slug. */
export function providerDisplayName(slug: string): string {
  return (
    PROVIDER_DISPLAY_NAMES[slug.toLowerCase()] ??
    slug.charAt(0).toUpperCase() + slug.slice(1)
  );
}
