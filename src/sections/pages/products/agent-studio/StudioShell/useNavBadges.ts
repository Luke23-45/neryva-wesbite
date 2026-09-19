import { useMemo } from 'react';
import type { BadgeKind, NavConfig } from './nav-config';

export interface NavBadgeValue {
  kind: BadgeKind;
  /** Absent = dot-only attention. Counts render only when provided. */
  count?: number;
}

/**
 * Badge VALUES keyed by item `to` (SIDEBAR_LEDGER.md §3). Kinds live in nav.json;
 * numbers live here. P1 returns nulls (structure + null-safety proven, no numbers
 * invented): Agents values land in P2, Libraries/Platform in P3.
 */
export type NavBadgeMap = Record<string, NavBadgeValue | null>;

export function useNavBadges(_config: NavConfig): NavBadgeMap {
  return useMemo(() => ({}), []);
}

/** Domain roll-up for level-1 rows: attention wins, then summed counts. */
export function aggregateDomainBadge(
  toList: string[],
  badges: NavBadgeMap,
): NavBadgeValue | null {
  let attention = false;
  let count = 0;
  let hasCount = false;
  for (const to of toList) {
    const badge = badges[to];
    if (!badge) continue;
    if (badge.kind === 'attention') attention = true;
    if (typeof badge.count === 'number') {
      count += badge.count;
      hasCount = true;
    }
  }
  if (!attention && !hasCount) return null;
  return attention ? { kind: 'attention', ...(hasCount ? { count } : {}) } : { kind: 'count', count };
}
