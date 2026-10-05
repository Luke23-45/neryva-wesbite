// @vitest-environment jsdom
/**
 * CatalogPage — the routed dense catalog list:
 * - Pure helpers: chip filters, mandatory source line, context formatting,
 *   pricing vocabulary, incomplete treatment.
 * - Server-driven sections (no client-side categorization).
 * - Chips narrow the list; the ZDR chip is backed by real data.
 * - Row click opens the slide-over drawer (never a modal); Escape closes.
 * - ACCESS toggle posts the provider enablement with optimistic update.
 * - Missing prices/context render honestly ("—"), never invented.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import {
  CatalogPage,
  applyChipFilters,
  sourceLine,
  formatContext,
  priceCell,
  transportLabel,
  type ChipKey,
} from './CatalogPage';
import type { ProviderDirectoryEntry } from '../api';

const mutateMock = vi.hoisted(() => vi.fn());
const providersOverride = vi.hoisted(
  () => ({ current: null }) as { current: import('../api').ProviderDirectoryEntry[] | null },
);

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-1' }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
}));

vi.mock('../hooks/useOrgTier', () => ({
  useOrgTier: () => 'payg',
  tierCovers: (_tier: string, required: string) => required !== 'enterprise',
}));

vi.mock('../hooks/useProviderDirectory', () => ({
  useProviderDirectory: () => ({
    data: { providers: providersOverride.current ?? fixture() },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/useProviderEnablement', () => ({
  useSetProviderEnabled: () => ({
    mutate: mutateMock,
    isPending: false,
    variables: undefined,
  }),
}));

function entry(over: Partial<ProviderDirectoryEntry> = {}): ProviderDirectoryEntry {
  return {
    provider: 'openai',
    display_name: 'OpenAI',
    transport: 'openai-compatible',
    model_count: 5,
    models: [{ model_id: 'gpt-4o', display_name: 'GPT-4o' }],
    from_price_per_1m: '2.50',
    to_price_per_1m: '10.00',
    max_context_tokens: 128000,
    door: 'platform',
    section: 'Frontier labs',
    pricing_mode: 'per_model',
    data_quality: 'complete',
    data_quality_reasons: [],
    zdr_capable: true,
    capabilities: ['tools', 'vision'],
    connection: { has_active_credential: false, enabled: true },
    min_required_product: 'free',
    min_required_product_label: 'Free',
    ...over,
  };
}

function fixture(): ProviderDirectoryEntry[] {
  return [
    entry(),
    entry({
      provider: 'acme-byok',
      display_name: 'Acme BYOK',
      door: 'byok',
      credential_label: 'Work key',
      credential_fingerprint: 'fp:9f2a',
      section: 'BYOK providers',
      model_count: 3,
      max_context_tokens: 200000,
      from_price_per_1m: undefined,
      to_price_per_1m: undefined,
      capabilities: ['tools'],
      zdr_capable: false,
      connection: { has_active_credential: true, enabled: false },
      min_required_product: 'payg',
      min_required_product_label: 'Pay-as-you-go',
    }),
    entry({
      provider: 'mystery',
      display_name: 'Mystery Lab',
      section: 'Frontier labs',
      pricing_mode: 'varies',
      data_quality: 'incomplete',
      data_quality_reasons: ['pricing not published', 'capabilities not published'],
      capabilities: [],
      zdr_capable: undefined,
      max_context_tokens: undefined,
      from_price_per_1m: undefined,
      to_price_per_1m: undefined,
    }),
  ];
}

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <CatalogPage />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  mutateMock.mockReset();
  providersOverride.current = null;
});

describe('catalog pure helpers', () => {
  it('applyChipFilters: tools/vision intersect; price drops unpriced and ≥$1', () => {
    const all = fixture();
    expect(applyChipFilters(all, new Set<ChipKey>())).toHaveLength(3);
    expect(applyChipFilters(all, new Set<ChipKey>(['tools']))).toHaveLength(2);
    expect(applyChipFilters(all, new Set<ChipKey>(['tools', 'vision']))).toHaveLength(1);
    expect(applyChipFilters(all, new Set<ChipKey>(['price']))).toHaveLength(0); // 2.50 ≥ 1
    const cheap = entry({ from_price_per_1m: '0.50' });
    expect(applyChipFilters([cheap], new Set<ChipKey>(['price']))).toHaveLength(1);
  });

  it('applyChipFilters: zdr keeps only attested rows; unknown is kept honestly when the chip is off', () => {
    const all = fixture();
    const zdr = applyChipFilters(all, new Set<ChipKey>(['zdr']));
    expect(zdr).toHaveLength(1);
    expect(zdr[0].provider).toBe('openai');
  });

  it('sourceLine names the door on every row', () => {
    expect(sourceLine(entry())).toBe('Platform pool · openai · OpenAI-Compatible');
    expect(sourceLine(entry({ transport: undefined }))).toBe('Platform pool · openai');
    expect(sourceLine(entry({ door: 'byok', credential_label: 'Work key', credential_fingerprint: 'fp:9f2a' }))).toBe(
      'Work key · fp:9f2a',
    );
  });

  it('formatContext formats compactly and returns null when unknown', () => {
    expect(formatContext(1000000)).toBe('1M');
    expect(formatContext(128000)).toBe('128K');
    expect(formatContext(500000)).toBe('500K');
    expect(formatContext(undefined)).toBeNull();
    expect(formatContext(0)).toBeNull();
  });

  it('priceCell speaks the pricing-mode vocabulary; missing per-model prices are honest', () => {
    expect(priceCell('2.50', 'per_model')).toEqual({ text: '$2.50', known: true });
    expect(priceCell(undefined, 'per_model')).toEqual({ text: '—', known: false });
    expect(priceCell(undefined, 'varies')).toEqual({ text: 'Varies', known: true });
    expect(priceCell(undefined, 'custom')).toEqual({ text: 'Custom', known: true });
    expect(priceCell(undefined, 'pass_through')).toEqual({ text: 'Pass-through', known: true });
  });

  it('transportLabel maps known transports and passes the rest through', () => {
    expect(transportLabel('openai-compatible')).toBe('OpenAI-Compatible');
    expect(transportLabel('ollama')).toBe('Ollama');
    expect(transportLabel(undefined)).toBeNull();
  });
});

describe('CatalogPage', () => {
  it('renders server-driven sections with counts and the column set', () => {
    renderPage();
    expect(screen.getByText('Frontier labs · 2')).toBeTruthy();
    expect(screen.getByText('BYOK providers · 1')).toBeTruthy();
    for (const col of ['Provider', 'Models', 'Plan', 'Access']) {
      expect(screen.getAllByText(col).length).toBeGreaterThan(0);
    }
    // Mandatory source lines.
    expect(screen.getByText('Platform pool · openai · OpenAI-Compatible')).toBeTruthy();
    expect(screen.getByText('Work key · fp:9f2a')).toBeTruthy();
  });

  it('the ZDR chip is backed by real data (no longer disabled)', () => {
    renderPage();
    const zdrChip = screen.getByRole('button', { name: 'ZDR Capable' });
    expect(zdrChip).not.toBeDisabled();
    fireEvent.click(zdrChip);
    expect(screen.getByText('OpenAI')).toBeTruthy();
    expect(screen.queryByText('Mystery Lab')).toBeNull();
    expect(screen.queryByText('Acme BYOK')).toBeNull();
  });

  it('row click opens the slide-over drawer; Escape closes it', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Mystery Lab details' }));
    expect(
      screen.getByRole('complementary', { name: 'Mystery Lab details' }),
    ).toBeTruthy();
    // Incomplete rows are honest inside the drawer too.
    expect(screen.getByText(/2 gaps in the published catalog/)).toBeTruthy();
    expect(screen.getAllByText('Not published').length).toBeGreaterThan(0);
    fireEvent.keyDown(window, { key: 'Escape' });
    // The slide-over exits via animation — wait for AnimatePresence to unmount.
    await waitFor(
      () => {
        expect(
          screen.queryByRole('complementary', { name: 'Mystery Lab details' }),
        ).toBeNull();
      },
      { timeout: 10000 },
    );
  });

  it('the ACCESS toggle posts the provider enablement', () => {
    renderPage();
    // Acme BYOK is currently disabled → the switch reads "Enable …".
    const sw = screen.getByRole('switch', { name: 'Enable Acme BYOK for this workspace' });
    fireEvent.click(sw);
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0]).toEqual({ provider: 'acme-byok', enabled: true });
  });

  it('renders the dashed custom-endpoint row and the footer copy', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /Connect custom endpoint/ })).toHaveAttribute(
      'href',
      '/agent-studio/providers/custom/new',
    );
    expect(screen.getByText(/ZDR = zero data retention/)).toBeTruthy();
    expect(screen.getByText(/your plan governs what can be enabled/)).toBeTruthy();
  });

  it('can_enable=false: row stays visible with a disabled switch + top-up nudge; no API fires', () => {
    providersOverride.current = [
      entry({
        can_enable: false,
        connection: { has_active_credential: false, enabled: false },
      }),
    ];
    renderPage();
    // The row is never hidden for no-plan orgs.
    expect(screen.getByText('OpenAI')).toBeTruthy();
    const sw = screen.getByRole('switch', { name: 'Enable OpenAI for this workspace' });
    expect(sw).toHaveAttribute('aria-disabled', 'true');
    const nudge = screen.getByRole('link', { name: 'Top up credits to enable' });
    expect(nudge).toHaveAttribute('href', '/platform/billing');
    // A disabled switch cannot trigger the toggle — the guard never fires the API.
    fireEvent.click(sw);
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('can_enable=false on a grandfathered ON row keeps the switch interactive for turning off', () => {
    providersOverride.current = [
      entry({
        can_enable: false,
        connection: { has_active_credential: false, enabled: true },
      }),
    ];
    renderPage();
    const sw = screen.getByRole('switch', { name: 'Disable OpenAI for this workspace' });
    expect(sw).not.toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(sw);
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0]).toEqual({ provider: 'openai', enabled: false });
  });

  it('a 402 provider_tier_required surfaces the top-up nudge, never the raw engine message', () => {
    renderPage();
    const sw = screen.getByRole('switch', { name: 'Enable Acme BYOK for this workspace' });
    fireEvent.click(sw);
    expect(mutateMock).toHaveBeenCalledTimes(1);
    const onError = mutateMock.mock.calls[0][1].onError as (err: unknown) => void;
    act(() => {
      onError({ status: 402, code: 'provider_tier_required', message: 'plan required' });
    });
    expect(screen.getByRole('link', { name: 'Top up credits to enable' })).toBeTruthy();
    expect(screen.queryByText('plan required')).toBeNull();
  });

  it('a non-tier toggle failure keeps the generic warning icon, not the nudge', () => {
    renderPage();
    const sw = screen.getByRole('switch', { name: 'Enable Acme BYOK for this workspace' });
    fireEvent.click(sw);
    const onError = mutateMock.mock.calls[0][1].onError as (err: unknown) => void;
    act(() => {
      onError({ status: 500, code: 'internal_error', message: 'boom' });
    });
    expect(screen.getByRole('img', { name: /Toggle failed/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Top up credits to enable' })).toBeNull();
  });
});
