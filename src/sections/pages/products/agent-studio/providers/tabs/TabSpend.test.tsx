// @vitest-environment jsdom
/**
 * Providers Phase 7 — Wave W1: TabSpend targeted tests.
 * - BYOK list-price figure is ALWAYS labeled "list-price equivalent — not billed";
 *   omitted when the engine reports no BYOK spend
 * - include_byok_spend toggle PATCHes { preferences: { include_byok_spend } }
 * - cap editor validation: non-negative USD (2 decimals) or blank; saves as
 *   integer cents; blank saves null (unlimited)
 * - fee panel renders engine-truth numbers + the PRV-008 provisional label
 * - export: Enterprise gets format dropdown + button; other tiers get the
 *   honest note
 * - tier gating: developer/reader roles see the honest note (no query fires);
 *   free tier gets read-only overview (no controls, no export)
 * - 7d/30d window Dropdown refetches the summary
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { TabSpend } from './TabSpend';
import type {
  CredentialUsageView,
  ProviderCredentialView,
  SpendSummaryView,
} from '@/sections/pages/products/agent-studio/providers/api';

const LIST_PRICE_LABEL = 'list-price equivalent — not billed';

const hoisted = vi.hoisted(() => ({
  role: 'owner' as string | null,
  tier: 'payg' as string,
  summary: null as SpendSummaryView | null,
  credentials: [] as ProviderCredentialView[],
  fetchSummary: vi.fn(),
  fetchCredentials: vi.fn(),
  fetchUsage: vi.fn(),
  patchBudget: vi.fn(),
  patchToggle: vi.fn(),
  exportSpend: vi.fn(),
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({
    orgId: 'org-1',
    role: hoisted.role,
    atLeast: (r: string) =>
      hoisted.role === 'owner' || (r === 'admin' && hoisted.role === 'admin'),
  }),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/hooks/useOrgTier', () => ({
  useOrgTier: () => hoisted.tier,
}));

vi.mock('@/sections/pages/products/agent-studio/providers/api', () => ({
  fetchSpendSummary: (...args: unknown[]) => hoisted.fetchSummary(...args),
  patchSpendBudget: (...args: unknown[]) => hoisted.patchBudget(...args),
  patchIncludeByokSpend: (...args: unknown[]) => hoisted.patchToggle(...args),
  downloadSpendExport: (...args: unknown[]) => hoisted.exportSpend(...args),
  fetchCredentials: (...args: unknown[]) => hoisted.fetchCredentials(...args),
  fetchCredentialUsage: (...args: unknown[]) => hoisted.fetchUsage(...args),
}));

function summaryFixture(over: Partial<SpendSummaryView> = {}): SpendSummaryView {
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
      { provider: 'anthropic', platform_spend_usd: '0', byok_settled_usd: '0', pricing_basis: 'settled' },
    ],
    budget: { cap_usd_cents: 5000, used_usd: '12.40', include_byok_spend: false },
    fee_config: {
      byok_fee_credits_per_call: 2,
      payg_margin_note: '30% margin on list cost for PAYG inference.',
    },
    ...over,
  };
}

function credFixture(id: string): ProviderCredentialView {
  return {
    id,
    provider: 'openai',
    label: `Key ${id}`,
    external_ref: id,
    source: 'byok',
    status: 'active',
    secret_fingerprint: 'sk-…8f9a',
    created_at: '2026-10-01T00:00:00Z',
    rotated_at: null,
    revoked_at: null,
    revocation_reason: null,
    compromised: false,
    priority: 0,
    enabled: true,
    allowed_models: null,
    allowed_assistants: null,
    shared_capacity_fallback: 'use_shared',
    transport: 'openai-compatible',
    base_url: null,
    custom_header_names: null,
    verification_status: 'verified',
    verified_at: '2026-10-01T00:00:00Z',
    last_probe_latency_ms: 100,
    discovered_models: [],
    zdr_attestation: null,
    region_attestation: null,
    attested_by: null,
    attested_at: null,
    manual_model_declarations: [],
  };
}

function usageFixture(over: Partial<CredentialUsageView> = {}): CredentialUsageView {
  return {
    requests: 120,
    tokens: { prompt: 1000, completion: 500, total: 1500 },
    spend_usd: '0.40',
    list_price_equivalent_usd: '3.10',
    pricing_basis: 'list',
    error_breakdown: { '401': 0, '403': 0, '429': 1, '5xx': 0 },
    window: '7d',
    ...over,
  };
}

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <TabSpend />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.role = 'owner';
  hoisted.tier = 'payg';
  hoisted.summary = summaryFixture();
  hoisted.credentials = [];
  hoisted.fetchSummary.mockImplementation(async () => hoisted.summary);
  hoisted.fetchCredentials.mockImplementation(async () => ({ credentials: hoisted.credentials }));
  hoisted.fetchUsage.mockImplementation(async () => usageFixture());
  hoisted.patchBudget.mockImplementation(async () => ({ cap_usd_cents: 5000 }));
  hoisted.patchToggle.mockImplementation(async () => ({}));
  hoisted.exportSpend.mockImplementation(async () => undefined);
});

describe('TabSpend honesty labels', () => {
  it('labels the BYOK figure as list-price equivalent, never billed', async () => {
    renderTab();
    await waitFor(() => {
      expect(screen.getAllByText('$88.10').length).toBeGreaterThanOrEqual(2);
    });
    // Overview card + BYOK breakdown row + (no credential rows here).
    expect(screen.getAllByText(LIST_PRICE_LABEL).length).toBeGreaterThanOrEqual(2);
  });

  it('omits the BYOK card and label when the engine reports no BYOK spend', async () => {
    hoisted.summary = summaryFixture({
      byok: { settled_usd: '0', calls: 0, fee: { calls: 0, per_call_credits: 2 } },
      providers: [
        { provider: 'openai', platform_spend_usd: '12.40', byok_settled_usd: '0', pricing_basis: 'settled' },
      ],
    });
    renderTab();
    await waitFor(() => {
      expect(screen.getAllByText('$12.40').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByText(LIST_PRICE_LABEL)).toBeNull();
    expect(screen.queryByText('BYOK spend')).toBeNull();
  });

  it('labels per-credential BYOK usage with the same honesty label', async () => {
    hoisted.credentials = [credFixture('c1')];
    renderTab();
    await waitFor(() => {
      expect(screen.getByText(/Spend per connected key/)).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getAllByText(new RegExp(LIST_PRICE_LABEL.replace(/[—]/g, '—'))).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('TabSpend include_byok_spend toggle', () => {
  it('PATCHes { preferences: { include_byok_spend: true } }', async () => {
    renderTab();
    const toggle = await screen.findByRole('switch', { name: /Include BYOK spend/i });
    fireEvent.click(toggle);
    // react-query invokes the mutationFn off the click event — assert async.
    await waitFor(() => {
      expect(hoisted.patchToggle).toHaveBeenCalledWith('org-1', true);
    });
  });

  it('billing role sees the toggle disabled with an honest note', async () => {
    hoisted.role = 'billing';
    renderTab();
    const toggle = await screen.findByRole('switch', { name: /Include BYOK spend/i });
    // The Switch kit signals disabled via aria-disabled (no native disabled attr).
    expect(toggle.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText(/Budget controls require the owner or admin role/)).toBeTruthy();
  });
});

describe('TabSpend cap editor', () => {
  async function openEditor() {
    renderTab();
    // Anchor on the accessible name — "Monthly cap (USD)" also appears as a
    // visible section label elsewhere in the card.
    return screen.findByLabelText('Monthly cap in USD, blank for unlimited');
  }

  it('rejects a negative cap without calling the engine', async () => {
    const input = await openEditor();
    fireEvent.change(input, { target: { value: '-5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save cap' }));
    expect(await screen.findByText(/non-negative amount/)).toBeTruthy();
    expect(hoisted.patchBudget).not.toHaveBeenCalled();
  });

  it('rejects more than 2 decimals', async () => {
    const input = await openEditor();
    fireEvent.change(input, { target: { value: '10.555' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save cap' }));
    expect(await screen.findByText(/non-negative amount/)).toBeTruthy();
    expect(hoisted.patchBudget).not.toHaveBeenCalled();
  });

  it('saves a valid USD amount as integer cents', async () => {
    const input = await openEditor();
    fireEvent.change(input, { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save cap' }));
    await waitFor(() => {
      expect(hoisted.patchBudget).toHaveBeenCalledWith('org-1', 2500);
    });
  });

  it('saves a blank field as null (unlimited)', async () => {
    const input = await openEditor();
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save cap' }));
    await waitFor(() => {
      expect(hoisted.patchBudget).toHaveBeenCalledWith('org-1', null);
    });
  });

  it('renders "Unlimited" when the engine reports no cap', async () => {
    hoisted.summary = summaryFixture({ budget: { cap_usd_cents: null, used_usd: '12.40', include_byok_spend: false } });
    renderTab();
    expect(await screen.findByText(/Unlimited — no cap is set/)).toBeTruthy();
  });
});

describe('TabSpend fee transparency', () => {
  it('renders engine-truth fee numbers with the single provisional margin line', async () => {
    renderTab();
    expect(await screen.findByText('2 credits per BYOK call')).toBeTruthy();
    expect(screen.getByText(/42 BYOK calls this window/)).toBeTruthy();
    expect(screen.getByText(/30% margin on list cost for PAYG inference/)).toBeTruthy();
    expect(
      screen.getByText(/Provisional — .* Final margin pending plan decision\./),
    ).toBeTruthy();
    // No internal IDs in user-facing copy.
    expect(document.body.textContent).not.toContain('PRV-008');
  });
});

describe('TabSpend audit export', () => {
  it('enterprise: format dropdown + export button downloads via the export endpoint', async () => {
    hoisted.tier = 'enterprise';
    renderTab();
    await screen.findByRole('button', { name: 'Export audit data' });
    fireEvent.click(screen.getByRole('button', { name: 'Export audit data' }));
    await waitFor(() => {
      expect(hoisted.exportSpend).toHaveBeenCalledWith('org-1', 'csv');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    fireEvent.click(screen.getByRole('option', { name: 'JSON' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export audit data' }));
    await waitFor(() => {
      expect(hoisted.exportSpend).toHaveBeenCalledWith('org-1', 'json');
    });
  });

  it('payg: export is gated with an honest note', async () => {
    renderTab();
    expect(await screen.findByText(/Audit export is available on the Enterprise plan/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Export audit data' })).toBeNull();
  });

  it('notes step-up auth and audit recording', async () => {
    hoisted.tier = 'enterprise';
    renderTab();
    expect(
      await screen.findByText(/Export requires step-up authentication and the export itself is recorded in the audit trail/),
    ).toBeTruthy();
  });
});

describe('TabSpend tier gating', () => {
  it('developer role sees the honest note and no query fires', async () => {
    hoisted.role = 'developer';
    renderTab();
    expect(await screen.findByText(/visible to the owner, admin, and billing roles only/)).toBeTruthy();
    expect(hoisted.fetchSummary).not.toHaveBeenCalled();
  });

  it('free tier gets a read-only overview: no controls, no export', async () => {
    hoisted.tier = 'free';
    renderTab();
    await waitFor(() => {
      expect(screen.getAllByText('$12.40').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByRole('switch', { name: /Include BYOK spend/i })).toBeNull();
    expect(screen.queryByLabelText('Monthly cap in USD, blank for unlimited')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Export audit data' })).toBeNull();
    expect(screen.getByText(/available on Pay-as-you-go and Enterprise plans/)).toBeTruthy();
  });
});

describe('TabSpend window switcher', () => {
  it('refetches the summary for 30d via the Dropdown kit', async () => {
    renderTab();
    await screen.findAllByText('$12.40');
    expect(hoisted.fetchSummary).toHaveBeenCalledWith('org-1', '7d');
    fireEvent.click(screen.getByRole('button', { name: 'Time window' }));
    // The option's accessible name includes its description ("Trailing 30-day
    // spend"), so match by substring like the rest of the suite.
    fireEvent.click(screen.getByRole('option', { name: /Last 30 days/ }));
    await waitFor(() => {
      expect(hoisted.fetchSummary).toHaveBeenCalledWith('org-1', '30d');
    });
  });
});
