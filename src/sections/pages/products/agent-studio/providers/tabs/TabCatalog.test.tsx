// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import TabCatalog from './TabCatalog';
import type { ProviderDirectoryEntry } from '../api';

const mockFetch = vi.hoisted(() => vi.fn());
vi.mock('@/sections/pages/products/agent-studio/providers/api', () => ({
  fetchProviderDirectory: mockFetch,
}));

let studioState = 'none';
vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({
    orgId: 'org-test',
    role: 'owner',
    entitlementState: (product: string) => (product === 'agent_studio' ? studioState : 'none'),
  }),
}));

const openai: ProviderDirectoryEntry = {
  provider: 'openai',
  display_name: 'OpenAI',
  transport: 'openai-compatible',
  model_count: 3,
  models: [
    { model_id: 'gpt-4o', display_name: 'GPT-4o' },
    { model_id: 'gpt-4o-mini', display_name: 'GPT-4o mini' },
  ],
  from_price_per_1m: '2.50',
  capabilities: ['tools', 'vision'],
  connection: { has_active_credential: true, enabled: true },
  min_required_product: 'free',
  min_required_product_label: 'Free',
};

const anthropic: ProviderDirectoryEntry = {
  provider: 'anthropic',
  display_name: 'Anthropic',
  transport: 'anthropic',
  model_count: 2,
  models: [{ model_id: 'claude-3-7-sonnet', display_name: 'Claude 3.7 Sonnet' }],
  from_price_per_1m: '0.25',
  capabilities: ['tools'],
  connection: { has_active_credential: false, enabled: false },
  min_required_product: 'payg',
  min_required_product_label: 'Requires Pay-as-you-go',
};

const ollama: ProviderDirectoryEntry = {
  provider: 'ollama',
  display_name: 'Ollama',
  transport: 'ollama',
  model_count: 5,
  models: [],
  capabilities: [],
  connection: { has_active_credential: false, enabled: false },
  min_required_product: 'free',
  min_required_product_label: 'Free',
};

const onConnectKey = vi.fn();

async function renderRouted(providers: ProviderDirectoryEntry[] = [openai, anthropic, ollama]) {
  mockFetch.mockResolvedValue({ providers });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['org', 'home'], { products: [] });

  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const providersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/providers',
    component: () => <TabCatalog onConnectKey={onConnectKey} />,
  });
  const stub = (path: string) =>
    createRoute({ getParentRoute: () => rootRoute, path, component: () => null });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      providersRoute,
      stub('/agent-studio/settings/pricing'),
      stub('/agent-studio/providers/custom/new'),
      stub('/contact'),
    ]),
    history: createMemoryHistory({ initialEntries: ['/agent-studio/providers'] }),
  });
  await router.load();
  const result = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  // The catalog tab lazy-loads nothing here (direct import) — wait for the
  // query to settle (skeleton grid carries the loading label).
  await waitFor(() => expect(mockFetch).toHaveBeenCalled());
  await waitFor(() => {
    expect(screen.queryByLabelText('Loading providers')).toBeNull();
  });
  return { router, ...result };
}

beforeEach(() => {
  vi.clearAllMocks();
  studioState = 'none';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TabCatalog', () => {
  it('renders categorized sections with full card anatomy', async () => {
    await renderRouted();

    expect(screen.getByRole('heading', { name: 'Frontier Labs' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Local Runtimes' })).toBeTruthy();

    // OpenAI card: transport badge, model count, from-price, capability badges, connection state
    // (Names repeat across card name + transport badge — assert multiplicities.)
    expect(screen.getAllByText('OpenAI').length).toBeGreaterThan(0);
    expect(screen.getByText('OpenAI-Compatible')).toBeTruthy();
    expect(screen.getByText('3 models')).toBeTruthy();
    expect(screen.getByText('From $2.50 / 1M')).toBeTruthy();
    expect(screen.getAllByText('Tools')).toHaveLength(2); // OpenAI + Anthropic cards
    expect(screen.getByText('Vision')).toBeTruthy();
    expect(screen.getByText('Connected')).toBeTruthy();

    // Unpriced provider is honest about it
    expect(screen.getAllByText('Ollama').length).toBeGreaterThan(0);
    expect(screen.getByText('Pricing not published')).toBeTruthy();
  });

  it('shows tier badges with an upgrade CTA only when the tier does not cover', async () => {
    await renderRouted(); // free tier: anthropic (payg) is not covered

    expect(screen.getByText('Requires Pay-as-you-go')).toBeTruthy();
    const upgrade = screen.getByRole('link', { name: 'Upgrade' });
    expect(upgrade.getAttribute('href')).toBe('/agent-studio/settings/pricing');

    // Free providers show the honest "included" pill instead (two free cards here).
    expect(screen.getAllByText('Included in your plan')).toHaveLength(2);
  });

  it('filters by the Needs Vision chip and clears back', async () => {
    await renderRouted();

    fireEvent.click(screen.getByRole('button', { name: /needs vision/i }));
    await waitFor(() => {
      expect(screen.queryAllByText('Anthropic')).toHaveLength(0);
      expect(screen.queryAllByText('Ollama')).toHaveLength(0);
    });
    expect(screen.getAllByText('OpenAI').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /needs vision/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Anthropic').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ollama').length).toBeGreaterThan(0);
    });
  });

  it('filters by the price chip (unpriced providers excluded, never assumed cheap)', async () => {
    await renderRouted();

    fireEvent.click(screen.getByRole('button', { name: /price < \$1\.00\/1m/i }));
    await waitFor(() => {
      expect(screen.queryAllByText('OpenAI')).toHaveLength(0); // $2.50 ≥ $1.00
      expect(screen.queryAllByText('Ollama')).toHaveLength(0); // unpriced ≠ cheap
    });
    expect(screen.getAllByText('Anthropic').length).toBeGreaterThan(0);
  });

  it('renders the ZDR chip disabled with an honest tooltip (no catalog data to filter on)', async () => {
    await renderRouted();
    const zdr = screen.getByRole('button', { name: /zdr capable/i });
    expect(zdr.getAttribute('disabled')).not.toBeNull();
  });

  it('debounces search and passes it to the server', async () => {
    await renderRouted(); // real timers for the initial load
    vi.useFakeTimers();

    const input = screen.getByLabelText('Search providers');
    fireEvent.change(input, { target: { value: 'anthropic' } });
    // Debounce pending — no second call yet.
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'org-test',
        expect.objectContaining({ search: 'anthropic' }),
      );
    });
  });

  it('opens the inline detail drawer on card click and closes it', async () => {
    await renderRouted();

    fireEvent.click(screen.getByRole('button', { name: /view openai details/i }));
    await waitFor(() => {
      expect(screen.getByLabelText('OpenAI details')).toBeTruthy();
    });
    expect(screen.getByText('gpt-4o')).toBeTruthy();
    expect(screen.getByText('gpt-4o-mini')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /close provider details/i }));
    await waitFor(
      () => {
        expect(screen.queryByLabelText('OpenAI details')).toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it('closes the detail drawer on Escape', async () => {
    await renderRouted();

    fireEvent.click(screen.getByRole('button', { name: /view anthropic details/i }));
    await waitFor(() => {
      expect(screen.getByLabelText('Anthropic details')).toBeTruthy();
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(
      () => {
        expect(screen.queryByLabelText('Anthropic details')).toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it('routes the Connect key action to the My providers tab without opening the drawer', async () => {
    await renderRouted();

    fireEvent.click(screen.getByRole('button', { name: /connect a key for anthropic/i }));
    expect(onConnectKey).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Anthropic details')).toBeNull();
  });

  it('shows the filter empty state when the search matches nothing', async () => {
    await renderRouted();
    // The server does the matching; the search refetch returns no providers.
    mockFetch.mockResolvedValue({ providers: [] });
    fireEvent.change(screen.getByLabelText('Search providers'), {
      target: { value: 'no-such-provider' },
    });
    await waitFor(
      () => {
        expect(screen.getByText('No providers match your filter criteria.')).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('shows the honest catalog-empty state when the catalog returns no providers', async () => {
    await renderRouted([]);
    await waitFor(() => {
      expect(screen.getByText('The provider catalog is empty.')).toBeTruthy();
    });
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  });

  it('sanitizes catalog load errors — no internals leak into the copy', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED secret-internal-host:5432 db neryva'));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['org', 'home'], { products: [] });
    const rootRoute = createRootRoute({ component: () => <Outlet /> });
    const providersRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/agent-studio/providers',
      component: () => <TabCatalog />,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([providersRoute]),
      history: createMemoryHistory({ initialEntries: ['/agent-studio/providers'] }),
    });
    await router.load();
    render(
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={client}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>,
    );

    await waitFor(
      () => {
        expect(screen.getByText("We couldn't load the provider catalog")).toBeTruthy();
      },
      // The hook retries once with the default backoff before surfacing the error.
      { timeout: 5000 },
    );
    expect(screen.queryByText(/ECONNREFUSED/)).toBeNull();
    expect(document.body.textContent).not.toContain('secret-internal-host');
  });

  it('notes the dev-only status of the Local Runtimes section', async () => {
    await renderRouted();
    expect(
      screen.getByText(/available in development workspaces only/i),
    ).toBeTruthy();
  });
});
