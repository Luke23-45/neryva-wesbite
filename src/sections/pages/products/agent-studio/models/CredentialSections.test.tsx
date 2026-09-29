// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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
import { CredentialNewSection } from './CredentialNewSection';
import { CredentialRotateSection } from './CredentialRotateSection';
import type { ProviderCredential } from '@hooks/studio/useSetupProviders';
import { MODEL_PROVIDERS } from '@hooks/studio/useSetupProviders';

let mockRole: string = 'owner';
let mockEnterprise: boolean | undefined = true;
let mockCredentials: ProviderCredential[] = [];

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

const createMutate = vi.fn();
const rotateMutate = vi.fn();

vi.mock('@hooks/studio/useSetupProviders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupProviders')>();
  return {
    ...actual,
    useCreateProviderCredential: () => ({
      mutate: (input: unknown, opts?: { onSuccess?: () => void }) => {
        createMutate(input, opts);
      },
      isPending: false,
    }),
    useRotateProviderCredential: () => ({
      mutate: (input: unknown, opts?: { onSuccess?: () => void }) => {
        rotateMutate(input, opts);
      },
      isPending: false,
    }),
    useProviderCredentials: () => ({
      data: mockCredentials,
      isPending: false,
      isError: false,
    }),
  };
});

vi.mock('@hooks/engine/billing', () => ({
  useEnterpriseStatus: () => ({ data: mockEnterprise }),
}));

function credential(overrides: Partial<ProviderCredential> = {}): ProviderCredential {
  return {
    id: 'c-1',
    provider: 'anthropic',
    label: 'prod-anthropic',
    externalRef: null,
    source: null,
    status: 'active',
    secretFingerprint: '****1234',
    revocationReason: null,
    compromised: false,
    createdAt: null,
    rotatedAt: null,
    revokedAt: null,
    ...overrides,
  };
}

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function routerAt(initialPath: string, role = 'owner') {
  mockRole = role;
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/models',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<div>models list</div>),
  });
  const newRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/credentials/new',
    component: () => shell(<CredentialNewSection />),
  });
  const rotateRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/credentials/$credentialId/rotate',
    component: () => shell(<CredentialRotateSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, newRoute, rotateRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  mockEnterprise = true;
  mockCredentials = [credential()];
  createMutate.mockClear();
  rotateMutate.mockClear();
  sessionStorage.clear();
  localStorage.clear();
});

const SECRET_LABEL = 'Secret (write-only — sealed on arrival, cleared on submit)';

describe('Credential section role-gate bounces', () => {
  it.each([
    ['/agent-studio/models/credentials/new'],
    ['/agent-studio/models/credentials/c-1/rotate'],
  ])('bounces a reader off %s to the models list', async (path) => {
    const router = await routerAt(path, 'reader');
    expect(router.state.location.pathname).toBe('/agent-studio/models');
  });

  it.each([
    ['/agent-studio/models/credentials/new'],
    ['/agent-studio/models/credentials/c-1/rotate'],
  ])('bounces a developer (not setup:govern) off %s', async (path) => {
    const router = await routerAt(path, 'developer');
    expect(router.state.location.pathname).toBe('/agent-studio/models');
  });

  it('renders nothing for the bounced role', async () => {
    await routerAt('/agent-studio/models/credentials/new', 'reader');
    expect(screen.queryByText('Add provider credential')).toBeNull();
    expect(screen.queryByLabelText(SECRET_LABEL)).toBeNull();
  });
});

describe('CredentialNewSection authorized render', () => {
  it('renders the add form for an owner', async () => {
    await routerAt('/agent-studio/models/credentials/new');
    expect(screen.getByText('Add provider credential')).toBeTruthy();
    expect(screen.getByLabelText('Label')).toBeTruthy();
    expect(screen.getByLabelText(SECRET_LABEL)).toBeTruthy();
    expect(screen.getByText('Add (MFA proof required)')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    // Back row: ‹ Models (the chevron is aria-hidden, so the name is "Models")
    expect(screen.getByRole('link', { name: 'Models' })).toHaveProperty(
      'href',
      expect.stringContaining('/agent-studio/models'),
    );
  });

  it('offers the closed provider vocabulary, defaulting to anthropic', async () => {
    await routerAt('/agent-studio/models/credentials/new');
    const select = screen.getByLabelText('Provider') as HTMLSelectElement;
    const options = within(select).getAllByRole('option').map((o) => (o as HTMLOptionElement).value);
    expect(options).toEqual([...MODEL_PROVIDERS]);
    expect(select.value).toBe(MODEL_PROVIDERS[1]);
  });

  it('bounces when BYOK is blocked (no enterprise commitment), like the hidden modal flow', async () => {
    mockEnterprise = false;
    const router = await routerAt('/agent-studio/models/credentials/new');
    expect(router.state.location.pathname).toBe('/agent-studio/models');
    expect(screen.queryByLabelText(SECRET_LABEL)).toBeNull();
  });

  it('fails open while the enterprise read is unresolved (legacy copy)', async () => {
    mockEnterprise = undefined;
    await routerAt('/agent-studio/models/credentials/new');
    expect(screen.getByLabelText(SECRET_LABEL)).toBeTruthy();
  });
});

describe('CredentialRotateSection authorized render', () => {
  it('renders rotate mode: provider select + secret, no label field', async () => {
    await routerAt('/agent-studio/models/credentials/c-1/rotate');
    expect(screen.getByText('Rotate — prod-anthropic')).toBeTruthy();
    expect(screen.getByLabelText('Provider')).toBeTruthy();
    expect(screen.getByLabelText(SECRET_LABEL)).toBeTruthy();
    expect(screen.queryByLabelText('Label')).toBeNull();
    expect(screen.getByText('Rotate (MFA proof required)')).toBeTruthy();
  });

  it('bounces an unknown credential id to the models list', async () => {
    const router = await routerAt('/agent-studio/models/credentials/nope/rotate');
    expect(router.state.location.pathname).toBe('/agent-studio/models');
    expect(screen.queryByLabelText(SECRET_LABEL)).toBeNull();
  });
});

describe('validation parity with the old modals', () => {
  it('keeps Add disabled until label + valid secret are present', async () => {
    await routerAt('/agent-studio/models/credentials/new');
    const add = screen.getByText('Add (MFA proof required)').closest('button')!;
    expect(add).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'prod-anthropic' } });
    expect(add).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByLabelText(SECRET_LABEL), { target: { value: '1234567' } });
    expect(screen.getByText('Secret must be 8–4096 characters.')).toBeTruthy();
    expect(add).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByLabelText(SECRET_LABEL), { target: { value: '12345678' } });
    expect(screen.queryByText('Secret must be 8–4096 characters.')).toBeNull();
    expect(add).toHaveProperty('disabled', false);
  });

  it('rejects a secret longer than 4096 chars', async () => {
    await routerAt('/agent-studio/models/credentials/new');
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'prod-anthropic' } });
    fireEvent.change(screen.getByLabelText(SECRET_LABEL), { target: { value: 'x'.repeat(4097) } });
    expect(screen.getByText('Secret must be 8–4096 characters.')).toBeTruthy();
    expect(screen.getByText('Add (MFA proof required)').closest('button')).toHaveProperty('disabled', true);
  });

  it('validates the trimmed value, like the modal', async () => {
    await routerAt('/agent-studio/models/credentials/new');
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'prod-anthropic' } });
    fireEvent.change(screen.getByLabelText(SECRET_LABEL), { target: { value: '  12345678  ' } });
    expect(screen.queryByText('Secret must be 8–4096 characters.')).toBeNull();
    expect(screen.getByText('Add (MFA proof required)').closest('button')).toHaveProperty('disabled', false);
  });

  it('keeps Rotate disabled until a valid secret is present', async () => {
    await routerAt('/agent-studio/models/credentials/c-1/rotate');
    const rotate = screen.getByText('Rotate (MFA proof required)').closest('button')!;
    expect(rotate).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText(SECRET_LABEL), { target: { value: 'short' } });
    expect(rotate).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText(SECRET_LABEL), { target: { value: 'long-enough-secret' } });
    expect(rotate).toHaveProperty('disabled', false);
  });
});

describe('secret hygiene', () => {
  it('hands the SAME mutation input to the step-up flow, then clears the secret', async () => {
    const router = await routerAt('/agent-studio/models/credentials/new');
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: '  prod-anthropic  ' } });
    fireEvent.change(screen.getByLabelText(SECRET_LABEL), { target: { value: '  s3cr3t-value-8  ' } });
    fireEvent.click(screen.getByText('Add (MFA proof required)'));

    // The section passes the trimmed input to the existing mutation hook —
    // the MFA step-up dialog lives inside that hook (runWithStepUp), so the
    // proof flow is unchanged from the modal.
    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(createMutate).toHaveBeenCalledWith(
      { provider: 'anthropic', label: 'prod-anthropic', secret: 's3cr3t-value-8' },
      expect.anything(),
    );
    // Cleared on submit (write-only).
    expect((screen.getByLabelText(SECRET_LABEL) as HTMLInputElement).value).toBe('');

    // Never in the URL, sessionStorage, or localStorage.
    const href = router.state.location.href;
    expect(href).not.toContain('s3cr3t-value-8');
    expect(router.state.location.searchStr ?? '').toBe('');
    expect(sessionStorage.length).toBe(0);
    for (let i = 0; i < sessionStorage.length; i += 1) {
      expect(sessionStorage.getItem(sessionStorage.key(i)!)).not.toContain('s3cr3t');
    }
    expect(localStorage.length).toBe(0);
  });

  it('clears the rotate secret on submit and keeps it out of the URL', async () => {
    const router = await routerAt('/agent-studio/models/credentials/c-1/rotate');
    fireEvent.change(screen.getByLabelText(SECRET_LABEL), { target: { value: 'new-secret-value-99' } });
    fireEvent.click(screen.getByText('Rotate (MFA proof required)'));

    expect(rotateMutate).toHaveBeenCalledTimes(1);
    expect(rotateMutate).toHaveBeenCalledWith(
      { credentialId: 'c-1', secret: 'new-secret-value-99' },
      expect.anything(),
    );
    expect((screen.getByLabelText(SECRET_LABEL) as HTMLInputElement).value).toBe('');
    expect(router.state.location.href).not.toContain('new-secret-value-99');
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });
});
