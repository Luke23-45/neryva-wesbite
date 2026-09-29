/**
 * Webhook section validation utilities — pure functions shared by the
 * webhook new/edit sections. Kept in a non-component module so the
 * companion component file (`webhook-section-shared.tsx`) only exports
 * components and styled constants (react-refresh rule).
 *
 * Validation is verbatim from the dialog-era WebhooksView: destination
 * URL must parse as http(s).
 */
export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
