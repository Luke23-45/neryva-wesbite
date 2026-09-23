/**
 * Link safety for assistant markdown (A3-46). Only these URL shapes may
 * become clickable anchors; anything else (notably `javascript:`, `data:`,
 * `vbscript:`) degrades to plain text with no anchor element.
 */
export function safeLinkUrl(href: string): string | null {
  const trimmed = href.trim();
  if (trimmed === '') return null;
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  // Relative URLs ("/path", "#frag", "page") are safe; anything with another
  // scheme is not.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return null;
  return trimmed;
}
