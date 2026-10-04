/**
 * Providers Spend — pure helpers for the per-model spend table.
 *
 * No invented numbers: every figure comes from the engine's
 * `ModelSpendResponse`. Shares are computed defensively (Law VII) —
 * unparseable or non-positive denominators yield null and the caller
 * renders '—'.
 */
import type { ModelSpendRow } from '../api';

/** One provider subgroup — rows keep engine (spend-desc) order. */
export interface ModelSpendProviderGroup {
  provider: string;
  provider_display_name: string;
  rows: ModelSpendRow[];
}

/**
 * Group rows by `provider`, preserving first-seen (spend-desc) order;
 * each group's rows keep input order.
 */
export function groupModelSpendByProvider(
  rows: ModelSpendRow[],
): ModelSpendProviderGroup[] {
  const groups: ModelSpendProviderGroup[] = [];
  const byProvider = new Map<string, ModelSpendProviderGroup>();
  for (const row of rows) {
    let group = byProvider.get(row.provider);
    if (!group) {
      group = {
        provider: row.provider,
        provider_display_name: row.provider_display_name,
        rows: [],
      };
      byProvider.set(row.provider, group);
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}

/** Parse an exact-decimal USD string; null when unparseable. */
function parseUsd(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * The row's fraction of total spend as a percent 0–100 (unrounded).
 * Null when either string is unparseable or total <= 0
 * (divide-by-zero guard → caller renders '—').
 */
export function spendSharePct(spendUsd: string, totalUsd: string): number | null {
  const spend = parseUsd(spendUsd);
  const total = parseUsd(totalUsd);
  if (spend === null || total === null || total <= 0) return null;
  return (spend / total) * 100;
}

export type VsPriorKind = 'up' | 'down' | 'flat' | 'new';

/**
 * Describe the row's % change vs the prior window.
 * null → new; 0 → flat ('—'); positive → up; negative → down.
 */
export function describeVsPrior(pct: number | null): {
  kind: VsPriorKind;
  label: string;
} {
  if (pct === null) return { kind: 'new', label: 'new' };
  if (pct === 0) return { kind: 'flat', label: '—' };
  if (pct > 0) return { kind: 'up', label: `↑ ${Math.round(pct)}%` };
  return { kind: 'down', label: `↓ ${Math.round(Math.abs(pct))}%` };
}

export interface TopModelSummary {
  model_display_name: string;
  spend_usd: string;
  sharePct: number | null;
  sourcesLabel: string;
}

/**
 * Summary of the top-spend model (rows[0] — the engine sorts by spend
 * desc). Null when rows is empty. `sourcesLabel` covers the distinct
 * `source` values across rows sharing the top row's model_id.
 */
export function topModelSummary(
  rows: ModelSpendRow[],
  totalUsd: string,
): TopModelSummary | null {
  if (rows.length === 0) return null;
  const top = rows[0];
  const sources = new Set<string>();
  for (const row of rows) {
    if (row.model_id === top.model_id) sources.add(row.source);
  }
  const sourcesLabel =
    sources.has('platform') && sources.has('byok')
      ? 'platform + BYOK'
      : sources.has('platform')
        ? 'Platform'
        : sources.has('byok')
          ? 'BYOK'
          : '—';
  return {
    model_display_name: top.model_display_name,
    spend_usd: top.spend_usd,
    sharePct: spendSharePct(top.spend_usd, totalUsd),
    sourcesLabel,
  };
}

/** Thousands-separated token counts, en-US (e.g. 12,345,678). */
export function formatTokens(n: number): string {
  return n.toLocaleString('en-US');
}
