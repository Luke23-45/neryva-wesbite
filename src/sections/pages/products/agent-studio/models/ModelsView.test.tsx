// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
import { ModelsView } from './ModelsView';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

// BYOK enterprise gate: the entitlement read is mutable per test —
// true = active enterprise commitment, false = none, undefined = unknown
// (loading/error; the UI fails open toward the legacy copy).
let enterpriseState: boolean | undefined = true;
// NG-MT-2: capture the options the view passes so a test can assert the
// read is disabled for roles the engine would 403.
let capturedEnterpriseOptions: { enabled?: boolean } | undefined;
vi.mock('@hooks/engine/billing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/engine/billing')>();
  return {
    ...actual,
    useEnterpriseStatus: (options?: { enabled?: boolean }) => {
      capturedEnterpriseOptions = options;
      return { data: enterpriseState };
    },
  };
});

const credentialMissingRow = {
  provider: 'anthropic',
  modelId: 'claude-x',
  ref: 'anthropic/claude-x',
  displayName: 'Claude X',
  contextWindowTokens: 200000,
  maxOutputTokens: 8000,
  capabilities: {},
  residency: null,
  usable: false,
  reasons: ['provider_credential_missing'],
  requiredProduct: null,
  requiredProductLabel: null,
};

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return {
    ...actual,
    useModelAvailability: () => ({ data: [credentialMissingRow], isPending: false, isError: false }),
    useModelCosts: () => ({ data: [], isPending: false, isError: false }),
  };
});

vi.mock('@hooks/studio/useSetupProviders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupProviders')>();
  return {
    ...actual,
    useProviderCredentials: () => ({ data: [], isPending: false, isError: false }),
    useCreateProviderCredential: () => ({ mutate: vi.fn(), isPending: false }),
    useRotateProviderCredential: () => ({ mutate: vi.fn(), isPending: false }),
    useRevokeProviderCredential: () => ({ mutate: vi.fn(), isPending: false }),
    useProviderEnablements: () => ({ data: [], isPending: false, isError: false }),
    useSetProviderEnablement: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

// canSetup is controllable per test (NG-MT-2 needs a reader scenario).
const mockCanSetup = vi.fn((_role: string | null, _act: string) => true);
vi.mock('@lib/engine/capabilities', () => ({
  canSetup: (role: string | null, act: string) => mockCanSetup(role, act),
  setupDeniedCopy: () => '',
}));

/** Router context — the BYOK gate's billing CTAs are router <Link>s. */
async function renderRouted() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const modelsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/agent-studio/models', component: () => <ModelsView /> });
  const billingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/agent-studio/settings/billing', component: () => null });
  const router = createRouter({
    routeTree: rootRoute.addChildren([modelsRoute, billingRoute]),
    history: createMemoryHistory({ initialEntries: ['/agent-studio/models'] }),
  });
  await router.load();
  const result = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { router, ...result };
}

function billingLink() {
  return screen.getByRole('link', { name: /view subscription options/i });
}

describe('ModelsView BYOK enterprise gate (P1-5)', () => {
  beforeEach(() => {
    enterpriseState = true;
    mockCanSetup.mockReturnValue(true);
    capturedEnterpriseOptions = undefined;
  });

  it('directs non-enterprise orgs to billing instead of the add flow (catalog hint)', async () => {
    enterpriseState = false;
    await renderRouted();
    expect(screen.getByText(/BYOK is an Enterprise feature/)).toBeTruthy();
    expect(billingLink().closest('a')?.getAttribute('href')).toBe('/agent-studio/settings/billing');
    expect(screen.queryByText(/add BYOK in Providers/)).toBeNull();
  });

  it('keeps the add-BYOK hint for enterprise orgs', async () => {
    enterpriseState = true;
    await renderRouted();
    expect(screen.getByText(/add BYOK in Providers/)).toBeTruthy();
    expect(screen.queryByText(/BYOK is an Enterprise feature/)).toBeNull();
  });

  it('fails open toward the legacy copy when the entitlement read is unknown', async () => {
    enterpriseState = undefined;
    await renderRouted();
    // A transient status read must not lock an enterprise org out — the
    // engine's 403 stays the backstop.
    expect(screen.getByText(/add BYOK in Providers/)).toBeTruthy();
    expect(screen.queryByText(/BYOK is an Enterprise feature/)).toBeNull();
  });

  it('hides the add-credential flow before any MFA step-up for non-enterprise orgs', async () => {
    enterpriseState = false;
    const { router } = await renderRouted();
    fireEvent.click(screen.getByRole('tab', { name: 'Providers' }));
    expect(screen.queryByRole('button', { name: /add credential/i })).toBeNull();
    expect(screen.getByText(/BYOK is an Enterprise feature/)).toBeTruthy();
    // The Providers-tab gate CTA is a navigating button (not a link) —
    // clicking it must land on billing.
    fireEvent.click(screen.getByRole('button', { name: /view subscription options/i }));
    expect(router.state.location.pathname).toBe('/agent-studio/settings/billing');
  });

  it('keeps the add-credential flow for enterprise orgs', async () => {
    enterpriseState = true;
    await renderRouted();
    fireEvent.click(screen.getByRole('tab', { name: 'Providers' }));
    expect(screen.getByRole('button', { name: /add credential/i })).toBeTruthy();
    expect(screen.queryByText(/BYOK is an Enterprise feature/)).toBeNull();
  });
});

describe('ModelsView enterprise-status gating (NG-MT-2)', () => {
  beforeEach(() => {
    enterpriseState = true;
    capturedEnterpriseOptions = undefined;
  });

  it('enables the enterprise-status read for the credential reader set', async () => {
    mockCanSetup.mockReturnValue(true); // owner/admin/developer
    await renderRouted();
    // The hook's `enabled` flag is what keeps the query from firing —
    // `false` means no request is ever issued.
    expect(capturedEnterpriseOptions?.enabled).toBe(true);
  });

  it('disables the enterprise-status read for readers — no doomed 403', async () => {
    mockCanSetup.mockReturnValue(false); // reader: no setup:author
    await renderRouted();
    expect(capturedEnterpriseOptions?.enabled).toBe(false);
    // With the read disabled, the view fails open toward the legacy
    // catalog copy instead of consuming a failed entitlement read.
    expect(screen.getByText(/add BYOK in Providers/)).toBeTruthy();
  });
});
