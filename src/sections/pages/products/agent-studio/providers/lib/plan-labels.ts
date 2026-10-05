/**
 * Short PLAN column labels — compact professional register for the provider
 * tables. Enterprise-ish engine labels ('Enterprise', 'Requires Ent.') stay
 * 'Enterprise' (spelled out); pay-as-you-go-ish labels ('Pay-as-you-go',
 * 'payg') become 'PAYG'. Anything else ('Included', 'Free', …) passes through
 * byte-identical. Tooltip and toast sentences keep the full wording; this is
 * the table cell only.
 */
export function shortPlanLabel(label: string): string {
  if (/enterprise|requires ent/i.test(label)) return 'Enterprise';
  if (/pay[\s-]*as[\s-]*you[\s-]*go|\bpayg\b/i.test(label)) return 'PAYG';
  return label;
}
