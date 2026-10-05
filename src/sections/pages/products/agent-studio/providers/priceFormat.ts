/**
 * One consistent USD-per-1M-tokens price formatter for the Providers
 * section (Catalog + Models pages).
 *
 * A known price under one cent renders as "<$0.01" — never "$0.00", which
 * would read as free. Honesty (Law VII): an uncertain or missing price is
 * the caller's job to mark unknown; this function only formats known,
 * non-negative numbers.
 */
export function formatUsdPer1M(price: number): string {
  if (price < 0.01) return '<$0.01';
  return `$${price.toFixed(2)}`;
}
