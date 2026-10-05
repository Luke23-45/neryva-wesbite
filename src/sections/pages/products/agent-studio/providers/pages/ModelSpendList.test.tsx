// @vitest-environment jsdom
/**
 * ModelSpendList + Top Model card tests:
 * - provider subheader rows ("OpenAI · 2") render before their model rows, in
 *   first-seen provider order
 * - columns: model display name + mono subline ("provider · model_id",
 *   plus "· BYOK <label>" for BYOK rows), SOURCE badges Platform/BYOK, the
 *   exact "list-price equivalent — not billed" text on BYOK rows,
 *   REQUESTS/TOKENS with toLocaleString formatting, the prompt/completion
 *   breakdown in the token cell's title tooltip, SPEND as USD
 * - SHARE is the pct of total_spend_usd; a zero total renders "—"
 * - VS PRIOR: up shows ↑ in the error tone, down ↓ in the success tone,
 *   null → "new", 0 → "—"; the header reads "VS PRIOR 7D" / "VS PRIOR 30D"
 *   per window
 * - Top Model card (OverviewCards, via SpendPage): renders with the top row's
 *   display name, spend, share, and sources label; absent when rows are empty
 * - empty / error / loading states
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { ModelSpendList, SpendPage } from './SpendPage';
import type { useModelSpend } from '../hooks/useModelSpend';
import type {
  ModelSpendResponse,
  ModelSpendRow,
  SpendSummaryView,
  SpendWindow,
} from '../api';
import { colors } from '../components/styles';

const LIST_PRICE_LABEL = 'list-price equivalent — not billed';

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

/** Spend-desc rows: gpt-5 platform $2.50, gpt-5 BYOK $1.00, claude-opus $6.50. */
const MODEL_SPEND: ModelSpendResponse = {
  window: '7d',
  total_spend_usd: '10.00',
  rows: [
    rowFixture(),
    rowFixture({
      source: 'byok',
      credential_id: 'c1',
      credential_label: 'Main key',
      requests: 200,
      prompt_tokens: 1800,
      completion_tokens: 640,
      total_tokens: 2440,
      spend_usd: '1.00',
      pricing_basis: 'list',
      vs_last_window_pct: -31.6,
    }),
    rowFixture({
      provider: 'anthropic',
      provider_display_name: 'Anthropic',
      model_id: 'claude-opus',
      model_display_name: 'Claude Opus',
      requests: 500,
      prompt_tokens: 5000,
      completion_tokens: 1000,
      total_tokens: 6000,
      spend_usd: '6.50',
      vs_last_window_pct: null,
    }),
  ],
};

function fakeQuery(over: {
  data?: ModelSpendResponse;
  isLoading?: boolean;
  isError?: boolean;
  refetch?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...over,
  } as unknown as ReturnType<typeof useModelSpend>;
}

function renderList(query: ReturnType<typeof useModelSpend>, window: SpendWindow = '7d') {
  return render(
    <ThemeProvider theme={theme}>
      <ModelSpendList query={query} window={window} />
    </ThemeProvider>,
  );
}

describe('ModelSpendList grouping', () => {
  it('renders provider subheaders before their model rows, in first-seen order', () => {
    renderList(fakeQuery({ data: MODEL_SPEND }));

    const openaiSub = screen.getByText('OpenAI · 2');
    const anthropicSub = screen.getByText('Anthropic · 1');
    const gpt5 = screen.getAllByText('GPT-5')[0];
    const opus = screen.getByText('Claude Opus');

    // First-seen provider order.
    expect(openaiSub.compareDocumentPosition(anthropicSub) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Each subheader precedes its own model rows.
    expect(openaiSub.compareDocumentPosition(gpt5) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(anthropicSub.compareDocumentPosition(opus) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('ModelSpendList columns', () => {
  it('renders the model name with the mono provider · model_id subline', () => {
    renderList(fakeQuery({ data: MODEL_SPEND }));
    expect(screen.getAllByText('GPT-5')).toHaveLength(2);
    expect(screen.getByText('openai · gpt-5')).toBeTruthy();
    expect(screen.getByText('openai · gpt-5 · BYOK Main key')).toBeTruthy();
    expect(screen.getByText('anthropic · claude-opus')).toBeTruthy();
  });

  it('renders SOURCE badges and the list-price honesty text on BYOK rows', () => {
    renderList(fakeQuery({ data: MODEL_SPEND }));
    expect(screen.getAllByText('Platform')).toHaveLength(2);
    expect(screen.getAllByText('BYOK')).toHaveLength(1);
    // The exact honesty label, once per list-priced BYOK row.
    expect(screen.getAllByText(LIST_PRICE_LABEL)).toHaveLength(1);
  });

  it('formats requests and tokens with thousands separators', () => {
    renderList(fakeQuery({ data: MODEL_SPEND }));
    expect(screen.getByText('1,000')).toBeTruthy();
    expect(screen.getByText('12,940')).toBeTruthy();
  });

  it('carries the prompt/completion breakdown in the token cell title', () => {
    renderList(fakeQuery({ data: MODEL_SPEND }));
    expect(screen.getByTitle('9,000 prompt · 3,940 completion')).toBeTruthy();
  });

  it('formats spend as USD', () => {
    renderList(fakeQuery({ data: MODEL_SPEND }));
    expect(screen.getByText('$2.50')).toBeTruthy();
    expect(screen.getByText('$6.50')).toBeTruthy();
  });
});

describe('ModelSpendList share', () => {
  it('shows each row’s pct of total_spend_usd', () => {
    renderList(fakeQuery({ data: MODEL_SPEND }));
    expect(screen.getByText('25%')).toBeTruthy();
    expect(screen.getByText('10%')).toBeTruthy();
    expect(screen.getByText('65%')).toBeTruthy();
  });

  it('renders “—” for every share when the total is zero', () => {
    const zeroTotal: ModelSpendResponse = {
      ...MODEL_SPEND,
      total_spend_usd: '0',
      rows: MODEL_SPEND.rows.map((r) => ({ ...r, vs_last_window_pct: 5 })),
    };
    renderList(fakeQuery({ data: zeroTotal }));
    expect(screen.getAllByText('—')).toHaveLength(3);
  });
});

describe('ModelSpendList vs prior', () => {
  it('shows ↑ in the error tone for an increase', () => {
    renderList(fakeQuery({ data: MODEL_SPEND }));
    const up = screen.getByText('↑ 12%');
    expect(up).toBeTruthy();
    expect(up).toHaveStyle({ color: colors.error });
  });

  it('shows ↓ in the success tone for a decrease', () => {
    renderList(fakeQuery({ data: MODEL_SPEND }));
    const down = screen.getByText('↓ 32%');
    expect(down).toBeTruthy();
    expect(down).toHaveStyle({ color: colors.success });
  });

  it('shows “new” for null and “—” for zero', () => {
    const rows: ModelSpendRow[] = [
      rowFixture({ vs_last_window_pct: null }),
      rowFixture({ model_id: 'gpt-4', vs_last_window_pct: 0, spend_usd: '1.00' }),
    ];
    renderList(fakeQuery({ data: { ...MODEL_SPEND, rows } }));
    expect(screen.getByText('new')).toBeTruthy();
    // One “—”: the flat-vs-prior cell (shares are 25%/10% here, no zero total).
    expect(screen.getAllByText('—')).toHaveLength(1);
  });

  it('labels the header VS PRIOR 7D for the 7d window', () => {
    renderList(fakeQuery({ data: MODEL_SPEND }), '7d');
    expect(screen.getByRole('columnheader', { name: /vs prior 7d/i })).toBeTruthy();
  });

  it('labels the header VS PRIOR 30D for the 30d window', () => {
    renderList(fakeQuery({ data: { ...MODEL_SPEND, window: '30d' } }), '30d');
    expect(screen.getByRole('columnheader', { name: /vs prior 30d/i })).toBeTruthy();
  });
});

describe('ModelSpendList states', () => {
  it('renders the empty state when rows are empty', () => {
    renderList(fakeQuery({ data: { window: '7d', total_spend_usd: '0', rows: [] } }));
    expect(screen.getByText('No model spend in this window.')).toBeTruthy();
  });

  it('renders the error state with a working Retry button', () => {
    const refetch = vi.fn();
    renderList(fakeQuery({ isError: true, refetch }));
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders the loading state', () => {
    renderList(fakeQuery({ isLoading: true }));
    expect(screen.getByText('Loading model spend…')).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* Top Model card (OverviewCards) — rendered via SpendPage.             */
/* OverviewCards is not exported, so the card is reached through the   */
/* page with the spend/model-spend endpoints mocked at the api seam.   */
/* ------------------------------------------------------------------ */

const hoisted = vi.hoisted(() => ({
  fetchSummary: vi.fn(),
  fetchModelSpend: vi.fn(),
  fetchCredentials: vi.fn(),
  fetchUsage: vi.fn(),
  patchBudget: vi.fn(),
  patchToggle: vi.fn(),
  exportSpend: vi.fn(),
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({
    orgId: 'org-1',
    role: 'owner',
    atLeast: () => true,
  }),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/hooks/useOrgTier', () => ({
  useOrgTier: () => 'payg',
}));

vi.mock('@/sections/pages/products/agent-studio/providers/api', () => ({
  fetchSpendSummary: (...args: unknown[]) => hoisted.fetchSummary(...args),
  fetchModelSpend: (...args: unknown[]) => hoisted.fetchModelSpend(...args),
  fetchCredentials: (...args: unknown[]) => hoisted.fetchCredentials(...args),
  fetchCredentialUsage: (...args: unknown[]) => hoisted.fetchUsage(...args),
  patchSpendBudget: (...args: unknown[]) => hoisted.patchBudget(...args),
  patchIncludeByokSpend: (...args: unknown[]) => hoisted.patchToggle(...args),
  downloadSpendExport: (...args: unknown[]) => hoisted.exportSpend(...args),
}));

function summaryFixture(): SpendSummaryView {
  return {
    window: '7d',
    requests: 84,
    platform_spend_usd: '12.40',
    byok: {
      settled_usd: '0',
      calls: 42,
      list_price_equivalent_usd: '88.10',
      fee: { calls: 42, per_call_credits: 2 },
    },
    providers: [
      { provider: 'openai', platform_spend_usd: '12.40', byok_settled_usd: '0', byok_list_price_equivalent_usd: '88.10', pricing_basis: 'list' },
    ],
    budget: { cap_usd_cents: 5000, used_usd: '12.40', include_byok_spend: false, breach_action: 'refuse' as const },
    fee_config: {
      byok_fee_credits_per_call: 2,
      payg_margin_note: '30% margin on list cost for PAYG inference.',
    },
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <SpendPage />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.fetchSummary.mockImplementation(async () => summaryFixture());
  hoisted.fetchModelSpend.mockImplementation(async () => MODEL_SPEND);
  hoisted.fetchCredentials.mockImplementation(async () => ({ credentials: [] }));
});

describe('Top Model card', () => {
  it('renders the top row’s name, spend, share, and sources label', async () => {
    renderPage();
    const label = await screen.findByText('Top model · 7d');
    const card = label.closest('div');
    expect(card).not.toBeNull();
    const scope = within(card as HTMLElement);
    expect(scope.getByText('GPT-5')).toBeTruthy();
    expect(scope.getByText('$2.50')).toBeTruthy();
    expect(scope.getByText(/25% of spend/)).toBeTruthy();
    expect(scope.getByText(/platform \+ BYOK/)).toBeTruthy();
  });

  it('is absent when the engine reports no model rows', async () => {
    hoisted.fetchModelSpend.mockImplementation(async () => ({
      window: '7d',
      total_spend_usd: '0',
      rows: [],
    }));
    renderPage();
    await screen.findByText('No model spend in this window.');
    expect(screen.queryByText('Top model · 7d')).toBeNull();
  });
});
