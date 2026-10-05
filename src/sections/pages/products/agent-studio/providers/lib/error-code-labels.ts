/**
 * One human-label map for engine error codes, shared by the Providers
 * section (Spend page error cells + My Providers usage summaries).
 *
 * Human copy for the closed engine error-code set — never a bare "429".
 * Unknown codes pass through verbatim: the engine may add codes, and a raw
 * unknown code is more honest than a wrong label. This lived page-scoped on
 * SpendPage until a second call site (KeyCard UsageSummary) kept rendering
 * raw codes — one shared helper so the pattern never forks again.
 */
export const ERROR_CODE_LABELS: Record<string, string> = {
  '401': 'Auth failed',
  '403': 'Forbidden',
  '429': 'Rate limited',
  '5xx': 'Provider errors',
};

/** Human label for an engine error code; unknown codes pass through. */
export function errorCodeLabel(code: string): string {
  return ERROR_CODE_LABELS[code] ?? code;
}
