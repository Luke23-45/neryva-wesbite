/**
 * Providers Phase 5 — Wave B: probe-failure remediation copy (doc 19 §13).
 *
 * One implementation, two consumers (ConnectKeyForm + CustomProviderForm).
 * Copy is actionable and never leaks internals: no stack traces, no raw
 * upstream bodies, no DNS/egress detail beyond what the operator needs.
 */

/** Actionable remediation copy for a failed discovery probe. */
export function probeErrorCopy(errorCode?: string, error?: string): string {
  const code = (errorCode ?? '').toLowerCase();
  const msg = (error ?? '').toLowerCase();
  // Normalize separators so codes like `invalid_api_key` match word checks.
  const hay = `${code} ${msg}`.replace(/[_-]+/g, ' ');

  if (hay.includes('ssrf') || hay.includes('private') || hay.includes('metadata')) {
    return 'Target address resolves to private or metadata network. Use a publicly reachable HTTPS endpoint.';
  }
  if (/\b401\b/.test(hay) || hay.includes('unauthorized') || (hay.includes('invalid') && (hay.includes('key') || hay.includes('token') || hay.includes('credential')))) {
    return 'Invalid API key. Check key permissions or generate a new key.';
  }
  if (/\b403\b/.test(hay) || hay.includes('forbidden') || hay.includes('scope') || hay.includes('permission')) {
    return 'Key lacks model-read permissions. Use manual model declaration or expand key scopes.';
  }
  if (/\b429\b/.test(hay) || hay.includes('rate limit') || hay.includes('quota')) {
    return 'Provider quota exceeded or rate-limited. Try again shortly.';
  }
  if (hay.includes('timeout') || hay.includes('timed out')) {
    return 'The endpoint did not answer in time. Check that the base URL is reachable, then retry.';
  }
  if (hay.includes('tls') || hay.includes('certificate') || hay.includes('ssl')) {
    return 'TLS verification failed. The endpoint must present a valid public certificate.';
  }
  if (error && error.trim()) {
    // Engine-supplied detail only, truncated — never the raw upstream body.
    return `The endpoint did not respond as expected: ${error.trim().slice(0, 200)}`;
  }
  return 'The endpoint did not respond as expected. Check the URL and credentials, then retry.';
}

/** Masked fingerprint display — fingerprint only, never plaintext. */
export function fingerprintLabel(fingerprint: string | null | undefined): string {
  if (!fingerprint) return 'no fingerprint';
  return fingerprint;
}
