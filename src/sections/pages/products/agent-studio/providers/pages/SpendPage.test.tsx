// @vitest-environment jsdom
/**
 * SpendPage — targeted tests (ported from the retired TabSpend suite):
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
 * - NEW: summary budget-cap card with progress; per-credential spend renders
 *   as the reference table (Credential / Requests / Spend / Errors / Share /
 *   Status) with the platform pool leading, dominant-error pills, and
 *   status pills; on-breach radios PATCH { breach_action } with optimistic
 *   rollback
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { SpendPage } from './SpendPage';
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
    budget: { cap_usd_cents: 5000, used_usd: '12.40', include_byok_spend: false, breach_action: 'refuse' as const },
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
    provider_display_name: 'OpenAI',
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

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  // The per-credential rows link to the Providers page (kebab affordance is
  // a real Link, not a dead button) — the established router-in-tests
  // pattern gives Link its RouterProvider context.
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={client}>
          <SpendPage />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const providersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'agent-studio/providers/my-providers',
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, providersRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
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

describe('SpendPage honesty labels', () => {
  it('labels the BYOK figure as list-price equivalent, never billed', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('$88.10').length).toBeGreaterThanOrEqual(2);
    });
    expect(screen.getAllByText(LIST_PRICE_LABEL).length).toBeGreaterThanOrEqual(2);
  });

  it('omits the BYOK card and label when the engine reports no BYOK spend', async () => {
    hoisted.summary = summaryFixture({
      byok: { settled_usd: '0', calls: 0, fee: { calls: 0, per_call_credits: 2 } },
      providers: [
        { provider: 'openai', platform_spend_usd: '12.40', byok_settled_usd: '0', pricing_basis: 'settled' },
      ],
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('$12.40').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByText(LIST_PRICE_LABEL)).toBeNull();
    expect(screen.queryByText('BYOK spend')).toBeNull();
  });

  it('labels per-credential BYOK usage with the same honesty label', async () => {
    hoisted.credentials = [credFixture('c1')];
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Per-credential spend/)).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getAllByText(new RegExp(LIST_PRICE_LABEL.replace(/[—]/g, '—'))).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('SpendPage summary cards', () => {
  it('renders the budget-cap card with progress from engine numbers', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Budget cap')).toBeTruthy();
    });
    expect(screen.getByText('$50.00')).toBeTruthy();
    // 12.40 / 50.00 = 24.8% → 25%.
    expect(screen.getByText(/25% used/)).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Monthly budget used' })).toHaveAttribute(
      'aria-valuenow',
      '25',
    );
  });

  it('renders Unlimited with no progress bar when the engine reports no cap', async () => {
    hoisted.summary = summaryFixture({
      budget: { cap_usd_cents: null, used_usd: '12.40', include_byok_spend: false, breach_action: 'refuse' as const },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Budget cap')).toBeTruthy();
    });
    expect(screen.getByText('Unlimited')).toBeTruthy();
    expect(screen.queryByRole('progressbar', { name: 'Monthly budget used' })).toBeNull();
  });
});

describe('SpendPage per-credential table', () => {
  it('renders the reference columns with honest share', async () => {
    hoisted.credentials = [credFixture('c1'), credFixture('c2')];
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Credential')).toBeTruthy();
    });
    for (const col of ['Credential', 'Requests', 'Spend', 'Errors', 'Share', 'Status']) {
      expect(screen.getByRole('columnheader', { name: col })).toBeTruthy();
    }
    // Platform pool leads the table with the engine's settled spend.
    expect(screen.getByText('Platform pool')).toBeTruthy();
    expect(screen.getByText('platform · pool · no key required')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getAllByText('120')).toHaveLength(2);
    });
    expect(screen.getAllByText('$0.40').length).toBeGreaterThanOrEqual(2);
    // $12.40 platform + two keys at $0.40 each = $13.20 → 3% each, 94% pool.
    expect(screen.getAllByText('3%').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('94%')).toBeTruthy();
    expect(screen.getByText(/the platform pool is included/)).toBeTruthy();
  });

  it('renders the dominant error as a warning pill', async () => {
    hoisted.credentials = [credFixture('c1')];
    renderPage();
    // usageFixture has a single 429.
    await waitFor(() => {
      expect(screen.getByText('429 ×1')).toBeTruthy();
    });
  });

  it('renders "—" for errors when the breakdown is clean', async () => {
    hoisted.credentials = [credFixture('c1')];
    hoisted.fetchUsage.mockImplementation(async () =>
      usageFixture({ error_breakdown: { '401': 0, '403': 0, '429': 0, '5xx': 0 } }),
    );
    renderPage();
    await waitFor(() => {
      // Header row + pool row + one credential row; the credential's
      // ERRORS cell reads "—".
      expect(screen.getAllByRole('row').length).toBe(3);
    });
    expect(screen.queryByText('429 ×1')).toBeNull();
  });

  it('shows Active for verified and a dimmed Revoked row with history retained', async () => {
    const revoked = credFixture('c2');
    // Revocation lives in `status` — the engine never emits it in
    // `verification_status` (P0-2: reading it there was dead code).
    revoked.status = 'revoked';
    revoked.revoked_at = '2026-10-02T00:00:00Z';
    hoisted.credentials = [credFixture('c1'), revoked];
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Revoked')).toBeTruthy();
    });
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/history retained/)).toBeTruthy();
  });
});

describe('SpendPage include_byok_spend toggle', () => {
  it('PATCHes { preferences: { include_byok_spend: true } }', async () => {
    renderPage();
    const toggle = await screen.findByRole('switch', { name: /Include BYOK spend/i });
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(hoisted.patchToggle).toHaveBeenCalledWith('org-1', true);
    });
  });

  it('billing role sees the toggle disabled with an honest note', async () => {
    hoisted.role = 'billing';
    renderPage();
    const toggle = await screen.findByRole('switch', { name: /Include BYOK spend/i });
    expect(toggle.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText(/Budget controls require the owner or admin role/)).toBeTruthy();
  });
});

describe('SpendPage cap editor', () => {
  async function openEditor() {
    renderPage();
    return screen.findByLabelText('Monthly cap in USD, blank for unlimited');
  }

  it('rejects a negative cap without calling the engine', async () => {
    const input = await openEditor();
    fireEvent.change(input, { target: { value: '-5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save cap' }));
    expect(screen.getByText(/non-negative amount/)).toBeTruthy();
    expect(hoisted.patchBudget).not.toHaveBeenCalled();
  });

  it('rejects more than 2 decimals', async () => {
    const input = await openEditor();
    fireEvent.change(input, { target: { value: '10.999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save cap' }));
    expect(screen.getByText(/up to 2 decimals/)).toBeTruthy();
    expect(hoisted.patchBudget).not.toHaveBeenCalled();
  });

  it('saves a valid USD amount as integer cents', async () => {
    const input = await openEditor();
    fireEvent.change(input, { target: { value: '75.50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save cap' }));
    await waitFor(() => {
      expect(hoisted.patchBudget).toHaveBeenCalledWith('org-1', { cap_usd_cents: 7550 });
    });
  });

  it('saves a blank field as null (unlimited)', async () => {
    const input = await openEditor();
    fireEvent.change(input, { target: { value: '80' } });
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save cap' }));
    await waitFor(() => {
      expect(hoisted.patchBudget).toHaveBeenCalledWith('org-1', { cap_usd_cents: null });
    });
  });

  it('renders "Unlimited" when the engine reports no cap', async () => {
    hoisted.summary = summaryFixture({
      budget: { cap_usd_cents: null, used_usd: '12.40', include_byok_spend: false, breach_action: 'refuse' as const },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Unlimited — no cap is set/)).toBeTruthy();
    });
  });
});

describe('SpendPage on-breach radios', () => {
  it('renders the engine breach_action with "Refuse new runs" checked by default', async () => {
    renderPage();
    const refuse = await screen.findByRole('radio', { name: /Refuse new runs/ });
    const alertOnly = screen.getByRole('radio', { name: /Alert only/ });
    expect((refuse as HTMLInputElement).checked).toBe(true);
    expect((alertOnly as HTMLInputElement).checked).toBe(false);
  });

  it('PATCHes { breach_action } when the radio changes', async () => {
    renderPage();
    const alertOnly = await screen.findByRole('radio', { name: /Alert only/ });
    fireEvent.click(alertOnly);
    await waitFor(() => {
      expect(hoisted.patchBudget).toHaveBeenCalledWith('org-1', { breach_action: 'alert_only' });
    });
  });

  it('rolls the radio back when the server rejects the change', async () => {
    hoisted.patchBudget.mockImplementation(async () => {
      throw new Error('nope');
    });
    renderPage();
    const alertOnly = await screen.findByRole('radio', { name: /Alert only/ });
    fireEvent.click(alertOnly);
    await waitFor(() => {
      // Optimistic flip happened, then rollback restored 'refuse'.
      const refuse = screen.getByRole('radio', { name: /Refuse new runs/ });
      expect((refuse as HTMLInputElement).checked).toBe(true);
    });
    expect(screen.getByText('nope')).toBeTruthy();
  });

  it('disables the radios for the billing role', async () => {
    hoisted.role = 'billing';
    renderPage();
    const refuse = await screen.findByRole('radio', { name: /Refuse new runs/ });
    expect((refuse as HTMLInputElement).disabled).toBe(true);
  });
});

describe('SpendPage intro and footer', () => {
  it('renders the intro line with an Invoices & plan link to /platform/billing', async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText(/Monitor spend per credential and model, and enforce a monthly cap/),
      ).toBeTruthy();
    });
    const link = screen.getByRole('link', { name: /Invoices & plan/ });
    expect(link).toHaveAttribute('href', '/platform/billing');
  });

  it('renders the reference footer copy with a Settings Billing link', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Caps refuse pre-call with reason/)).toBeTruthy();
    });
    const link = screen.getByRole('link', { name: 'Settings Billing' });
    expect(link).toHaveAttribute('href', '/agent-studio/settings/billing');
  });
});

describe('SpendPage fee transparency', () => {
  it('renders engine-truth fee numbers with the single provisional margin line', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/2 credits per BYOK call/)).toBeTruthy();
    });
    expect(screen.getByText(/Provisional — 30% margin on list cost for PAYG inference/)).toBeTruthy();
  });
});

describe('SpendPage audit export', () => {
  it('enterprise: format dropdown + export button downloads via the export endpoint', async () => {
    hoisted.tier = 'enterprise';
    renderPage();
    const btn = await screen.findByRole('button', { name: 'Export audit data' });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(hoisted.exportSpend).toHaveBeenCalledWith('org-1', 'csv');
    });
  });

  it('payg: export is gated with an honest note', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Audit export is available on the Enterprise plan/)).toBeTruthy();
    });
    expect(screen.queryByRole('button', { name: 'Export audit data' })).toBeNull();
  });

  it('notes step-up auth and audit recording', async () => {
    hoisted.tier = 'enterprise';
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/step-up authentication/)).toBeTruthy();
    });
  });
});

describe('SpendPage tier gating', () => {
  it('developer role sees the honest note and no query fires', async () => {
    hoisted.role = 'developer';
    renderPage();
    expect(await screen.findByText(/visible to the owner, admin, and billing roles only/)).toBeTruthy();
    expect(hoisted.fetchSummary).not.toHaveBeenCalled();
  });

  it('free tier gets a read-only overview: no controls, no export', async () => {
    hoisted.tier = 'free';
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('$12.40').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByRole('switch', { name: /Include BYOK spend/i })).toBeNull();
    expect(screen.queryByLabelText('Monthly cap in USD, blank for unlimited')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Export audit data' })).toBeNull();
    expect(screen.getByText(/available on Pay-as-you-go and Enterprise plans/)).toBeTruthy();
  });
});

describe('SpendPage window switcher', () => {
  it('refetches the summary for 30d via the Dropdown kit', async () => {
    renderPage();
    await screen.findAllByText('$12.40');
    expect(hoisted.fetchSummary).toHaveBeenCalledWith('org-1', '7d');
    fireEvent.click(screen.getByRole('button', { name: 'Time window' }));
    fireEvent.click(screen.getByRole('option', { name: /Last 30 days/ }));
    await waitFor(() => {
      expect(hoisted.fetchSummary).toHaveBeenCalledWith('org-1', '30d');
    });
  });
});
