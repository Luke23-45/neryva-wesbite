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
  humanizeDataQualityReason,
  effectiveEnableTier,
  type ChipKey,
} from './CatalogPage';
import type { ProviderDirectoryEntry } from '../api';

const mutateMock = vi.hoisted(() => vi.fn());
const tierOverride = vi.hoisted(() => ({ current: 'payg' }));
const roleOverride = vi.hoisted(() => ({ current: 'owner' }));
const providersOverride = vi.hoisted(
  () => ({ current: null }) as { current: import('../api').ProviderDirectoryEntry[] | null },
);

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-1', role: roleOverride.current }),
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
  useOrgTier: () => tierOverride.current,
  tierCovers: (tier: string, required: string) => {
    // Honest mirror of the real tierCovers rank comparison.
    const rank: Record<string, number> = { free: 0, payg: 1, enterprise: 2 };
    if (tier === 'unknown') return null;
    return (rank[tier] ?? -1) >= (rank[required] ?? 0);
  },
}));

vi.mock('../hooks/useProviderDirectory', () => ({
  // Faithful stand-in for the server: the real hook sends `search` to the
  // engine, which substrings over provider id, display name, and model
  // ids/names. A mock that ignored the filter would make any search-driven
  // test vacuous (the list could never change).
  useProviderDirectory: (_orgId: string | null, filters?: { search?: string }) => {
    const q = filters?.search?.trim().toLowerCase();
    let providers = providersOverride.current ?? fixture();
    if (q) {
      providers = providers.filter((p) => {
        const modelHay = p.models.map((m) => `${m.model_id} ${m.display_name}`).join(' ');
        return `${p.provider} ${p.display_name} ${modelHay}`.toLowerCase().includes(q);
      });
    }
    return {
      data: { providers },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
  },
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
    transport: 'OpenAI-compatible',
    model_count: 5,
    models: [{ model_id: 'gpt-4o', display_name: 'GPT-4o' }],
    from_price_per_1m: 2.5,
    to_price_per_1m: 10.0,
    max_context_tokens: 128000,
    door: 'platform',
    section: 'Frontier labs',
    pricing_mode: 'per_model',
    data_quality: 'complete',
    data_quality_reasons: [],
    zdr_capable: true,
    capabilities: ['tools', 'vision'],
    connection: { has_active_credential: false, enabled: true, stored_enabled: true },
    min_required_product: 'payg',
    min_required_product_label: 'Pay-as-you-go',
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
      data_quality_reasons: ['pricing_unknown', 'capabilities_unknown'],
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
  tierOverride.current = 'payg';
  roleOverride.current = 'owner';
});

describe('catalog pure helpers', () => {
  it('applyChipFilters: tools/vision intersect; price drops unpriced and ≥$1', () => {
    const all = fixture();
    expect(applyChipFilters(all, new Set<ChipKey>())).toHaveLength(3);
    expect(applyChipFilters(all, new Set<ChipKey>(['tools']))).toHaveLength(2);
    expect(applyChipFilters(all, new Set<ChipKey>(['tools', 'vision']))).toHaveLength(1);
    expect(applyChipFilters(all, new Set<ChipKey>(['price']))).toHaveLength(0); // 2.50 ≥ 1
    const cheap = entry({ from_price_per_1m: 0.5 });
    expect(applyChipFilters([cheap], new Set<ChipKey>(['price']))).toHaveLength(1);
  });

  it('applyChipFilters: zdr keeps only attested rows; unknown is kept honestly when the chip is off', () => {
    const all = fixture();
    const zdr = applyChipFilters(all, new Set<ChipKey>(['zdr']));
    expect(zdr).toHaveLength(1);
    expect(zdr[0].provider).toBe('openai');
  });

  it('sourceLine names the door on every row', () => {
    expect(sourceLine(entry())).toBe('Platform pool · openai · OpenAI-compatible');
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

  it('priceCell speaks the pricing-mode vocabulary; sub-cent prices never render as $0.00', () => {
    expect(priceCell(2.5, 'per_model')).toEqual({ text: '$2.50', known: true });
    expect(priceCell(0.00014, 'per_model')).toEqual({ text: '<$0.01', known: true });
    expect(priceCell(0, 'per_model')).toEqual({ text: '<$0.01', known: true });
    expect(priceCell(undefined, 'per_model')).toEqual({ text: '—', known: false });
    expect(priceCell(Number.NaN, 'per_model')).toEqual({ text: '—', known: false });
    expect(priceCell(undefined, 'varies')).toEqual({ text: 'Varies', known: true });
    expect(priceCell(undefined, 'custom')).toEqual({ text: 'Custom', known: true });
    expect(priceCell(undefined, 'pass_through')).toEqual({ text: 'Pass-through', known: true });
  });

  it('transportLabel passes the registry display labels through; blank is null', () => {
    expect(transportLabel('OpenAI-compatible')).toBe('OpenAI-compatible');
    expect(transportLabel('Anthropic')).toBe('Anthropic');
    expect(transportLabel('  OpenAI-compatible  ')).toBe('OpenAI-compatible');
    expect(transportLabel(undefined)).toBeNull();
    expect(transportLabel('')).toBeNull();
  });

  it('humanizeDataQualityReason turns codes and timestamps into human copy', () => {
    expect(humanizeDataQualityReason('metadata_snapshot_missing')).toBe(
      'model data not yet published for this provider',
    );
    expect(humanizeDataQualityReason('pricing_unknown')).toBe('pricing not published');
    expect(humanizeDataQualityReason('capabilities_unknown')).toBe('capabilities not published');
    const stale = humanizeDataQualityReason('metadata_snapshot_stale_since_2026-09-01T00:00:00.000Z');
    expect(stale).toMatch(/^model data is stale \(last updated .+2026\)$/);
    expect(stale).not.toContain('T00:00:00');
    // Unknown codes pass through verbatim — never invented.
    expect(humanizeDataQualityReason('some_future_code')).toBe('some_future_code');
  });

  it('effectiveEnableTier floors the requirement at payg (never "Included")', () => {
    expect(effectiveEnableTier('free')).toBe('payg');
    expect(effectiveEnableTier('payg')).toBe('payg');
    expect(effectiveEnableTier('enterprise')).toBe('enterprise');
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
    expect(screen.getByText('Platform pool · openai · OpenAI-compatible')).toBeTruthy();
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

  it('anchors the drawer panel to the selected row so it mounts in view', () => {
    // jsdom has no layout engine: fake the geometry the anchoring hook measures.
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const top = this.dataset.providerId ? 620 : 120;
        return {
          top, left: 0, bottom: top, right: 0, width: 0, height: 0, x: 0, y: top,
          toJSON: () => ({}),
        } as DOMRect;
      });
    const heightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.tagName === 'ASIDE' ? 500 : 4000;
      });
    try {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Mystery Lab details' }));
      const panel = screen.getByRole('complementary', { name: 'Mystery Lab details' });
      // Row at 620, layout at 120 → 500px anchor; clamp allows up to 4000-500-16.
      expect(panel.style.marginTop).toBe('500px');
    } finally {
      rectSpy.mockRestore();
      heightSpy.mockRestore();
    }
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

  it('a developer sees disabled access switches plus the honest hint — the engine rejects developers with 403', () => {
    // The catalog toggle endpoint is owner/admin-only (unlike the Models
    // endpoints, which accept developers) — a developer must never see an
    // interactive switch that only 403s.
    roleOverride.current = 'developer';
    renderPage();
    expect(screen.getByText('Only owners and admins can change provider access.')).toBeTruthy();
    const sw = screen.getByRole('switch', { name: 'Enable Acme BYOK for this workspace' });
    expect(sw).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(sw);
    expect(mutateMock).not.toHaveBeenCalled();
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
    expect(nudge).toHaveAttribute('href', '/agent-studio/settings/pricing');
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

  it('plan pill follows the floored tier: a "free" row minimum never reads "Included"', () => {
    providersOverride.current = [
      entry({ min_required_product: 'free', min_required_product_label: 'Free' }),
    ];
    renderPage();
    expect(screen.queryByText('Included')).toBeNull();
    expect(screen.getByText('Pay-as-you-go')).toBeTruthy();
  });

  it('can_enable=true wins over a stale client tier — the switch stays visible', () => {
    // The client thinks the org is on 'free'; the server says the plan
    // covers this provider. The old code rendered only the upgrade link
    // and hid the off-switch.
    tierOverride.current = 'free';
    providersOverride.current = [
      entry({
        can_enable: true,
        connection: { has_active_credential: false, enabled: false, stored_enabled: false },
      }),
    ];
    renderPage();
    expect(
      screen.getByRole('switch', { name: 'Enable OpenAI for this workspace' }),
    ).toBeTruthy();
    expect(screen.queryByText('Upgrade →')).toBeNull();
  });

  it('the switch follows stored_enabled, not the tier-gated enabled flag', () => {
    // Grandfathered row: the engine serves enabled=false (tier lapsed) but
    // the stored toggle is still ON. The switch must render checked from
    // the stored value so the org can turn it OFF.
    providersOverride.current = [
      entry({
        can_enable: false,
        connection: { has_active_credential: false, enabled: false, stored_enabled: true },
      }),
    ];
    renderPage();
    const sw = screen.getByRole('switch', { name: 'Disable OpenAI for this workspace' });
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(sw).not.toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(sw);
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0]).toEqual({ provider: 'openai', enabled: false });
  });

  it('Escape in the search field clears the query instead of closing the drawer', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Mystery Lab details' }));
    expect(
      screen.getByRole('complementary', { name: 'Mystery Lab details' }),
    ).toBeTruthy();
    const search = screen.getByLabelText('Search providers');
    fireEvent.change(search, { target: { value: 'zzz' } });
    // The input debounces 250ms before the list filters.
    await waitFor(() => {
      expect(screen.queryByText('OpenAI')).toBeNull();
    });
    fireEvent.keyDown(search, { key: 'Escape' });
    // The drawer survives; the filter is cleared.
    expect(
      screen.getByRole('complementary', { name: 'Mystery Lab details' }),
    ).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeTruthy();
    });
  });

  it('drawer focus: opens with focus inside, Escape closes and returns focus to the row button', () => {
    renderPage();
    const trigger = screen.getByRole('button', { name: 'Mystery Lab details' });
    fireEvent.click(trigger);
    const drawer = screen.getByRole('complementary', { name: 'Mystery Lab details' });
    // Focus moves into the drawer on open.
    expect(drawer.contains(document.activeElement)).toBe(true);
    // Escape (from inside the drawer) closes it…
    fireEvent.keyDown(drawer, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // …and focus returns to the row's details button.
    expect(document.activeElement).toBe(trigger);
  });

  it('search placeholder promises only what the server searches (no tags)', () => {
    renderPage();
    // The server matches provider id, display name, and model ids/names —
    // there are no tags in the metadata, so the copy must not promise them.
    expect(screen.getByLabelText('Search providers')).toHaveAttribute(
      'placeholder',
      'Search providers, models…',
    );
  });

  it('toggle-failure explanation is keyboard reachable', () => {
    renderPage();
    const sw = screen.getByRole('switch', { name: 'Enable Acme BYOK for this workspace' });
    fireEvent.click(sw);
    const onError = mutateMock.mock.calls[0][1].onError as (err: unknown) => void;
    act(() => {
      onError({ status: 500, code: 'internal_error', message: 'boom' });
    });
    const icon = screen.getByRole('img', { name: /Toggle failed/ });
    // The Tooltip trigger wraps the icon and must be tabbable so keyboard
    // users can read the failure explanation.
    expect(icon.closest('[tabindex="0"]')).not.toBeNull();
  });
});
