/**
 * Agent-detail tab vocabulary (ledger 1.23).
 *
 * The page used to be seventeen equal-weight panels stacked in one column,
 * which gave the eye no order and put every fact on screen twice. The tabs
 * group by what the reader came to do, not by which table the data is in:
 *
 *  - `overview`      what is this agent, and is it healthy right now
 *  - `configuration` what it is built from (mirrors the builder, read-only)
 *  - `versions`      the immutable history and the publish gate
 *  - `test`          prove it works and prove it is good
 *  - `operate`       the levers, and what they have been doing
 */

export const AGENT_DETAIL_TABS = [
  'overview',
  'configuration',
  'versions',
  'test',
  'operate',
] as const;

export type AgentDetailTab = (typeof AGENT_DETAIL_TABS)[number];

export const DEFAULT_AGENT_DETAIL_TAB: AgentDetailTab = 'overview';

export function isAgentDetailTab(value: unknown): value is AgentDetailTab {
  return typeof value === 'string' && (AGENT_DETAIL_TABS as readonly string[]).includes(value);
}