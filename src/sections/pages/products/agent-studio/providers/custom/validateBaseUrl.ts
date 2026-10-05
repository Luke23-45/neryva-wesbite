/**
 * Providers Phase 5 — Wave B: client-side base-URL validation for the custom
 * provider form (pure, unit-tested).
 *
 * Instant feedback only — the server is the authoritative SSRF/URL gate
 * (doc 19 §8). Kept in its own module so CustomProviderForm.tsx exports only
 * components (react-refresh rule).
 */
export type UrlState = 'idle' | 'valid' | 'warning' | 'invalid';

export function validateBaseUrl(raw: string): { state: UrlState; message: string } {
  const value = raw.trim();
  if (!value) return { state: 'idle', message: '' };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    // P1-5: the example must be an honest public endpoint — the old
    // internal-corp example contradicted the SSRF posture (private hosts
    // are blocked, by design).
    return { state: 'invalid', message: 'Enter a valid URL, e.g. https://llm.example.com/v1.' };
  }
  if (url.protocol === 'https:') {
    // fall through to host checks
  } else if (url.protocol === 'http:') {
    if (import.meta.env.PROD) {
      return { state: 'invalid', message: 'HTTPS is required in production.' };
    }
    return {
      state: 'warning',
      message: 'Plain HTTP is allowed only in local development — never in production.',
    };
  } else {
    return { state: 'invalid', message: 'Only https: (or http: in local development) URLs are accepted.' };
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const privateHost =
    host === 'localhost' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (privateHost) {
    return {
      state: 'invalid',
      // Deliberate SSRF posture (engine ssrfSafeFetch agrees): only
      // publicly reachable HTTPS endpoints. Corp-internal allowlisting is a
      // future founder decision, not a silent exception.
      message: 'Private, loopback, and link-local addresses are blocked — use a publicly reachable HTTPS endpoint.',
    };
  }
  return { state: 'valid', message: 'URL validated.' };
}
