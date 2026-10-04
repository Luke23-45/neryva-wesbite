// @vitest-environment jsdom
/**
 * model-spend lib — pure unit tests:
 * - groupModelSpendByProvider: first-seen provider order, per-group counts,
 *   subheader components (provider_display_name + count), input order within
 *   each group
 * - spendSharePct: exact math, null on unparseable / non-positive totals,
 *   no clamping when a row exceeds the total
 * - describeVsPrior: new / flat / up / down labels
 * - topModelSummary: empty → null, rows[0] wins, share via total,
 *   sourcesLabel scoped to same-model_id rows only
 * - formatTokens: en-US thousands separators
 */
import { describe, expect, it } from 'vitest';
import {
  describeVsPrior,
  formatTokens,
  groupModelSpendByProvider,
  spendSharePct,
  topModelSummary,
} from './model-spend';
import type { ModelSpendRow } from '../api';

function rowFixture(over: Partial<ModelSpendRow> = {}): ModelSpendRow {
  return {
    provider: 'openai',
    provider_display_name: 'OpenAI',
    model_id: 'gpt-5',
    model_display_name: 'GPT-5',
    source: 'platform',
    credential_id: null,
    credential_label: null,
    requests: 1000,
    prompt_tokens: 9000,
    completion_tokens: 3940,
    total_tokens: 12940,
    spend_usd: '2.50',
    pricing_basis: 'settled',
    vs_last_window_pct: 12.4,
    ...over,
  };
}

describe('groupModelSpendByProvider', () => {
  it('preserves first-seen provider order', () => {
    const rows = [
      rowFixture({ provider: 'anthropic', provider_display_name: 'Anthropic' }),
      rowFixture(),
      rowFixture({ provider: 'anthropic', provider_display_name: 'Anthropic' }),
    ];
    const groups = groupModelSpendByProvider(rows);
    expect(groups.map((g) => g.provider)).toEqual(['anthropic', 'openai']);
  });

  it('counts rows per group and carries provider_display_name', () => {
    const rows = [
      rowFixture(),
      rowFixture({ source: 'byok', credential_label: 'Main key' }),
      rowFixture({ provider: 'anthropic', provider_display_name: 'Anthropic' }),
    ];
    const groups = groupModelSpendByProvider(rows);
    expect(groups).toHaveLength(2);
    expect(groups[0].provider_display_name).toBe('OpenAI');
    expect(groups[0].rows).toHaveLength(2);
    expect(groups[1].provider_display_name).toBe('Anthropic');
    expect(groups[1].rows).toHaveLength(1);
  });

  it('keeps input order within each group', () => {
    const rows = [
      rowFixture({ model_id: 'gpt-5', spend_usd: '2.50' }),
      rowFixture({ provider: 'anthropic', provider_display_name: 'Anthropic', model_id: 'claude-opus' }),
      rowFixture({ model_id: 'gpt-4', spend_usd: '1.00', source: 'byok' }),
    ];
    const groups = groupModelSpendByProvider(rows);
    expect(groups[0].rows.map((r) => r.model_id)).toEqual(['gpt-5', 'gpt-4']);
  });

  it('returns no groups for an empty input', () => {
    expect(groupModelSpendByProvider([])).toEqual([]);
  });
});

describe('spendSharePct', () => {
  it('computes the fraction of total as a percent', () => {
    expect(spendSharePct('2.50', '10.00')).toBe(25);
  });

  it('returns 0 for a zero spend against a positive total', () => {
    expect(spendSharePct('0', '10')).toBe(0);
  });

  it('returns null when the total is zero', () => {
    expect(spendSharePct('2.50', '0')).toBeNull();
  });

  it('returns null when the total is negative', () => {
    expect(spendSharePct('2.50', '-1')).toBeNull();
  });

  it('returns null for unparseable inputs', () => {
    expect(spendSharePct('abc', '10.00')).toBeNull();
    expect(spendSharePct('2.50', 'abc')).toBeNull();
    expect(spendSharePct(undefined as unknown as string, '10.00')).toBeNull();
  });

  it('does not clamp a row spend larger than the total', () => {
    expect(spendSharePct('15', '10')).toBe(150);
  });
});

describe('describeVsPrior', () => {
  it('maps null to new', () => {
    expect(describeVsPrior(null)).toEqual({ kind: 'new', label: 'new' });
  });

  it('maps 0 to flat', () => {
    expect(describeVsPrior(0)).toEqual({ kind: 'flat', label: '—' });
  });

  it('maps a positive change to up with a rounded label', () => {
    expect(describeVsPrior(12.4)).toEqual({ kind: 'up', label: '↑ 12%' });
  });

  it('maps a negative change to down with a rounded absolute label', () => {
    expect(describeVsPrior(-31.6)).toEqual({ kind: 'down', label: '↓ 32%' });
  });
});

describe('topModelSummary', () => {
  it('returns null for empty rows', () => {
    expect(topModelSummary([], '10.00')).toBeNull();
  });

  it('summarizes rows[0] with its share of the total', () => {
    const rows = [
      rowFixture({ spend_usd: '2.50' }),
      rowFixture({ model_id: 'gpt-4', spend_usd: '1.00' }),
    ];
    const summary = topModelSummary(rows, '10.00');
    expect(summary).not.toBeNull();
    expect(summary?.model_display_name).toBe('GPT-5');
    expect(summary?.spend_usd).toBe('2.50');
    expect(summary?.sharePct).toBe(25);
  });

  it('labels platform + BYOK when the same model_id has both sources', () => {
    const rows = [
      rowFixture({ source: 'platform' }),
      rowFixture({ source: 'byok', credential_label: 'Main key', pricing_basis: 'list' }),
    ];
    expect(topModelSummary(rows, '10.00')?.sourcesLabel).toBe('platform + BYOK');
  });

  it('labels Platform for a platform-only top model', () => {
    const rows = [rowFixture({ source: 'platform' })];
    expect(topModelSummary(rows, '10.00')?.sourcesLabel).toBe('Platform');
  });

  it('labels BYOK for a byok-only top model', () => {
    const rows = [rowFixture({ source: 'byok', pricing_basis: 'list' })];
    expect(topModelSummary(rows, '10.00')?.sourcesLabel).toBe('BYOK');
  });

  it('ignores other model_ids when building the sources label', () => {
    const rows = [
      rowFixture({ source: 'platform' }),
      rowFixture({ model_id: 'gpt-4', source: 'byok', pricing_basis: 'list' }),
    ];
    expect(topModelSummary(rows, '10.00')?.sourcesLabel).toBe('Platform');
  });
});

describe('formatTokens', () => {
  it('formats with en-US thousands separators', () => {
    expect(formatTokens(12940)).toBe('12,940');
    expect(formatTokens(1000000)).toBe('1,000,000');
    expect(formatTokens(0)).toBe('0');
  });
});
