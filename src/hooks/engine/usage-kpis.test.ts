import { describe, expect, it } from 'vitest';
import { parseOverviewKpis } from './usage';

/**
 * P6-US-24/25/26/27 — the overview KPI parser: per-product project breakdowns
 * must not duplicate the product-level cards, numeric-string cost_usd must
 * surface as a money KPI, and multi-product slices must be labeled.
 */
const overviewPayload = {
  window: { from: '2026-09-01', to: '2026-09-25' },
  products: [
    {
      product: 'agent_studio',
      cost_usd: '0.300000',
      events: 24,
      tokens_in: 13500,
      tokens_out: 5100,
      projects: [
        {
          project_id: 'proj-1',
          cost_usd: '0.300000',
          events: 24,
          tokens_in: 13500,
          tokens_out: 5100,
        },
      ],
    },
  ],
};

describe('parseOverviewKpis', () => {
  it('does not duplicate product KPIs from the projects breakdown', () => {
    const kpis = parseOverviewKpis(overviewPayload);
    const labels = kpis.map((k) => k.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toEqual(['cost usd', 'events', 'tokens in', 'tokens out']);
  });

  it('renders numeric-string cost as money', () => {
    const kpis = parseOverviewKpis(overviewPayload);
    const cost = kpis.find((k) => /cost/i.test(k.label));
    expect(cost?.value).toBe('$0.30');
  });

  it('labels KPIs by product when the overview spans several products', () => {
    const multi = {
      products: [
        { ...overviewPayload.products[0], projects: [] },
        {
          product: 'chat',
          cost_usd: '1.200000',
          events: 10,
          tokens_in: 100,
          tokens_out: 50,
          projects: [],
        },
      ],
    };
    const kpis = parseOverviewKpis(multi);
    const labels = kpis.map((k) => k.label);
    expect(labels.filter((l) => l === 'events')).toHaveLength(0);
    expect(labels).toContain('agent studio · events');
    expect(labels).toContain('chat · events');
  });

  it('returns [] for non-object input', () => {
    expect(parseOverviewKpis(null)).toEqual([]);
    expect(parseOverviewKpis(undefined)).toEqual([]);
    expect(parseOverviewKpis('nope')).toEqual([]);
  });
});
