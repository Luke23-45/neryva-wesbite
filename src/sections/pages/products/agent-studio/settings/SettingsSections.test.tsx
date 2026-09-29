// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
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
import { ApiKeyCreateSection } from './ApiKeyCreateSection';
import { TwoFactorSetupSection } from './TwoFactorSetupSection';

let mockRole = 'owner';
let mockMfaEnabled = false;

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole, canManageMembers: mockRole !== 'reader' }),
}));

const issueMutateAsync = vi.fn();
const enrollMutateAsync = vi.fn();
const activateMutateAsync = vi.fn();
const rotateCodesMutateAsync = vi.fn();

vi.mock('@hooks/engine/mutations', () => ({
  useIssueKey: () => ({ mutateAsync: issueMutateAsync, isPending: false }),
  useRevokeKey: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@hooks/studio/useStudioKeys', () => ({
  expiresAtFromChoice: (choice: string) => (choice === 'never' ? undefined : '2099-01-01T00:00:00.000Z'),
}));

vi.mock('@hooks/studio/useDefaultProject', () => ({
  useDefaultProject: () => ({ project: null, isLoading: false }),
}));

vi.mock('@hooks/studio/useMfa', () => ({
  useMfa: () => ({ data: { enabled: mockMfaEnabled }, isPending: false, isError: false }),
  useEnrollTotp: () => ({ mutateAsync: enrollMutateAsync, isPending: false }),
  useActivateTotp: () => ({ mutateAsync: activateMutateAsync, isPending: false }),
  useRotateRecoveryCodes: () => ({ mutateAsync: rotateCodesMutateAsync, isPending: false }),
  parseEnrollment: () => ({ otpauthUrl: null, secret: 'JBSW Y3DP EHPK 3PXP' }),
  otpauthFromSecret: (secret: string) => `otpauth://totp/Neryva?secret=${secret}`,
}));

vi.mock('@hooks/studio/useAccount', () => ({
  useAccount: () => ({ data: { email: 'user@example.com' } }),
}));

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function routerAt(initialPath: string, role = 'owner', mfaEnabled = false) {
  mockRole = role;
  mockMfaEnabled = mfaEnabled;
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/settings',
    component: () => <Outlet />,
  });
  const keysIndexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/api-keys',
    component: () => shell(<div>api keys list</div>),
  });
  const keysNewRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/api-keys/new',
    component: () => shell(<ApiKeyCreateSection />),
  });
  const securityIndexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/security',
    component: () => shell(<div>security tab</div>),
  });
  const twoFactorRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/security/two-factor/setup',
    component: () => shell(<TwoFactorSetupSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([keysIndexRoute, keysNewRoute, securityIndexRoute, twoFactorRoute]),
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  mockMfaEnabled = false;
  issueMutateAsync.mockReset();
  enrollMutateAsync.mockReset();
  activateMutateAsync.mockReset();
  rotateCodesMutateAsync.mockReset();
  issueMutateAsync.mockResolvedValue({ id: 'key-1', key: 'neryva_test_secret_key' });
  enrollMutateAsync.mockResolvedValue({ otpauth_url: 'otpauth://totp/x' });
  activateMutateAsync.mockResolvedValue({ codes: ['rc-1', 'rc-2', 'rc-3', 'rc-4'] });
  rotateCodesMutateAsync.mockResolvedValue({ codes: ['new-1', 'new-2', 'new-3', 'new-4'] });
  sessionStorage.clear();
});

describe('G-1 ApiKeyCreateSection role-gate bounce', () => {
  it.each([['billing'], ['reader']])('bounces %s to the keys list before any form renders', async (role) => {
    const router = await routerAt('/agent-studio/settings/api-keys/new', role);
    expect(router.state.location.pathname).toBe('/agent-studio/settings/api-keys');
    expect(screen.queryByText('Key name')).toBeNull();
  });

  it('renders the wizard for a write role (owner)', async () => {
    const router = await routerAt('/agent-studio/settings/api-keys/new', 'owner');
    expect(router.state.location.pathname).toBe('/agent-studio/settings/api-keys/new');
    expect(screen.getByText('Create API key')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. Production backend')).toBeTruthy();
  });
});

describe('G-1 wizard step semantics', () => {
  it('blocks Continue on details with an empty name and never issues', async () => {
    await routerAt('/agent-studio/settings/api-keys/new');
    fireEvent.click(screen.getByText('Continue'));
    expect(issueMutateAsync).not.toHaveBeenCalled();
    // still on details
    expect(screen.getByPlaceholderText('e.g. Production backend')).toBeTruthy();
  });

  it('walks details → scopes → expiry, honors Back, then generates', async () => {
    await routerAt('/agent-studio/settings/api-keys/new');
    fireEvent.change(screen.getByPlaceholderText('e.g. Production backend'), {
      target: { value: 'Production backend' },
    });
    fireEvent.click(screen.getByText('Continue'));
    // scopes step
    expect(screen.getByText('3 of 6 scopes selected')).toBeTruthy();
    fireEvent.click(screen.getByText('Back'));
    // back on details with the name intact
    expect((screen.getByPlaceholderText('e.g. Production backend') as HTMLInputElement).value).toBe(
      'Production backend',
    );
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('3 of 6 scopes selected')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue'));
    // expiry step
    expect(screen.getByText('When should this key expire?')).toBeTruthy();
    expect(screen.getByText('Recommended')).toBeTruthy();
    fireEvent.click(screen.getByText('Generate key'));
    await act(async () => {});
    expect(issueMutateAsync).toHaveBeenCalledTimes(1);
    const input = issueMutateAsync.mock.calls[0][0] as Record<string, unknown>;
    expect(input.name).toBe('Production backend');
    expect(input.role).toBe('operator');
    expect(input.scopes).toEqual(['agents:read', 'conversations:read', 'analytics:read']);
    expect(input.expires_at).toBe('2099-01-01T00:00:00.000Z');
  });

  it('composes individual scope toggles into the generate payload', async () => {
    await routerAt('/agent-studio/settings/api-keys/new');
    fireEvent.change(screen.getByPlaceholderText('e.g. Production backend'), {
      target: { value: 'Production backend' },
    });
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('3 of 6 scopes selected')).toBeTruthy();
    // toggling an individual scope updates the count and the payload
    fireEvent.click(screen.getByRole('switch', { name: /Write agents/ }));
    expect(screen.getByText('4 of 6 scopes selected')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Generate key'));
    await act(async () => {});
    const payload = issueMutateAsync.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.scopes).toEqual(['agents:read', 'agents:write', 'conversations:read', 'analytics:read']);
  });
});

describe('G-1 shown-once secret', () => {
  async function generate() {
    await routerAt('/agent-studio/settings/api-keys/new');
    fireEvent.change(screen.getByPlaceholderText('e.g. Production backend'), {
      target: { value: 'Production backend' },
    });
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Generate key'));
    await act(async () => {});
  }

  it('writes the reveal marker and shows the secret exactly once', async () => {
    await generate();
    expect(sessionStorage.getItem('settings:api-keys:create:revealed:key-1')).toBe('1');
    expect(screen.getByText('Key created')).toBeTruthy();
    expect(screen.getByText('neryva_test_secret_key')).toBeTruthy();
    expect(screen.getByText('Copy key')).toBeTruthy();
    // prefix note renders the first 14 chars, never the whole secret twice
    expect(screen.getByText(/only time the full secret will be shown/)).toBeTruthy();
    // the secret never touches sessionStorage itself — marker only
    const stored = Object.keys(sessionStorage)
      .map((k) => sessionStorage.getItem(k))
      .join(' ');
    expect(stored).not.toContain('neryva_test_secret_key');
  });

  it('Done returns to the keys list', async () => {
    const router = await routerAt('/agent-studio/settings/api-keys/new');
    await (async () => {
      fireEvent.change(screen.getByPlaceholderText('e.g. Production backend'), {
        target: { value: 'Production backend' },
      });
      fireEvent.click(screen.getByText('Continue'));
      fireEvent.click(screen.getByText('Continue'));
      fireEvent.click(screen.getByText('Generate key'));
      await act(async () => {});
    })();
    fireEvent.click(screen.getByText('Done'));
    expect(router.state.location.pathname).toBe('/agent-studio/settings/api-keys');
  });

  it('shows the explicit already-revealed state on refresh with a new-key recovery path', async () => {
    sessionStorage.setItem('settings:api-keys:create:latest', 'key-1');
    await routerAt('/agent-studio/settings/api-keys/new');
    // the wizard form is gone — never a silent re-render of the secret
    expect(screen.queryByPlaceholderText('e.g. Production backend')).toBeNull();
    expect(screen.getByText('Already revealed')).toBeTruthy();
    expect(screen.getByText(/never\s*rendered twice/)).toBeTruthy();
    expect(issueMutateAsync).not.toHaveBeenCalled();
    // recovery: start a new key
    fireEvent.click(screen.getByText('Create a new key'));
    expect(screen.getByPlaceholderText('e.g. Production backend')).toBeTruthy();
    expect(sessionStorage.getItem('settings:api-keys:create:latest')).toBeNull();
  });
});

describe('G-6 TwoFactorSetupSection — per-account, no role gate', () => {
  it.each([['owner'], ['reader']])('renders the setup flow for %s and enrolls on mount', async (role) => {
    const router = await routerAt('/agent-studio/settings/security/two-factor/setup', role);
    expect(router.state.location.pathname).toBe('/agent-studio/settings/security/two-factor/setup');
    expect(enrollMutateAsync).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('heading', { level: 1, name: 'Set up two-factor' })).toBeTruthy();
    // QR renders as an SVG; manual key is shown with the copy affordance
    const qrRegion = screen.getByText('Or enter this setup key manually').parentElement as HTMLElement;
    expect(qrRegion).toBeTruthy();
    expect(screen.getByText('JBSW Y3DP EHPK 3PXP')).toBeTruthy();
    expect(screen.getByLabelText('Copy setup key')).toBeTruthy();
  });

  it('shows the already-on state instead of enrolling when 2FA is enabled', async () => {
    await routerAt('/agent-studio/settings/security/two-factor/setup', 'owner', true);
    expect(await screen.findByText('Already on')).toBeTruthy();
    expect(enrollMutateAsync).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Verification code')).toBeNull();
  });
});

describe('G-6 verify → codes shown-once', () => {
  async function reachVerify() {
    await routerAt('/agent-studio/settings/security/two-factor/setup');
    await screen.findByRole('heading', { level: 1, name: 'Set up two-factor' });
    fireEvent.click(screen.getByText('Continue'));
    // the stepped panels cross-fade via AnimatePresence — the verify input
    // mounts once the scan panel's exit completes
    return screen.findByLabelText('Verification code');
  }

  it('requires 6 digits, then writes the marker and shows the codes once', async () => {
    const input = (await reachVerify()) as HTMLInputElement;
    expect(screen.getByRole('heading', { level: 1, name: 'Verify code' })).toBeTruthy();
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.click(screen.getByText('Verify'));
    expect(activateMutateAsync).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verify'));
    await act(async () => {});
    expect(activateMutateAsync).toHaveBeenCalledWith('123456');
    expect(sessionStorage.getItem('settings:security:2fa:recovery:revealed')).toBe('1');
    expect(await screen.findByRole('heading', { level: 1, name: 'Save recovery codes' })).toBeTruthy();
    // the codes panel mounts once the verify panel's exit completes
    expect(await screen.findByText('rc-1')).toBeTruthy();
    expect(screen.getByLabelText('Copy code 1')).toBeTruthy();
    expect(screen.getByText('Download as text')).toBeTruthy();
    // the "I've saved them" gate
    expect(screen.getByText("I've saved them")).toBeTruthy();
    const stored = Object.keys(sessionStorage)
      .map((k) => sessionStorage.getItem(k))
      .join(' ');
    expect(stored).not.toContain('rc-1');
  });

  it("finishing via I've saved them returns to the security tab", async () => {
    const router = await routerAt('/agent-studio/settings/security/two-factor/setup');
    await screen.findByRole('heading', { level: 1, name: 'Set up two-factor' });
    fireEvent.click(screen.getByText('Continue'));
    const input = (await screen.findByLabelText('Verification code')) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verify'));
    await screen.findByRole('heading', { level: 1, name: 'Save recovery codes' });
    fireEvent.click(screen.getByText("I've saved them"));
    expect(router.state.location.pathname).toBe('/agent-studio/settings/security');
  });

  it('shows the explicit already-revealed state on refresh; regenerate re-issues fresh codes', async () => {
    sessionStorage.setItem('settings:security:2fa:recovery:revealed', '1');
    await routerAt('/agent-studio/settings/security/two-factor/setup');
    expect(await screen.findByText('Already revealed')).toBeTruthy();
    // never re-enroll, never re-display old codes
    expect(enrollMutateAsync).not.toHaveBeenCalled();
    expect(screen.queryByText('rc-1')).toBeNull();
    expect(screen.queryByLabelText('Verification code')).toBeNull();
    // recovery path: regenerate — server re-issues new codes
    fireEvent.click(screen.getByText('Generate new codes'));
    expect(await screen.findByText('Generate new recovery codes?')).toBeTruthy();
    const codeInput = document.querySelector('input[inputmode="numeric"]') as HTMLInputElement;
    fireEvent.change(codeInput, { target: { value: '654321' } });
    // two "Generate new codes" buttons: the state's recovery button and the
    // modal's — the modal's is last in the DOM
    const generateBtns = screen.getAllByText('Generate new codes');
    fireEvent.click(generateBtns[generateBtns.length - 1]);
    await act(async () => {});
    expect(rotateCodesMutateAsync).toHaveBeenCalledWith({ code: '654321' });
    expect(sessionStorage.getItem('settings:security:2fa:recovery:revealed')).toBe('1');
    // the freshly issued codes render immediately (old codes never re-appear)
    expect(await screen.findByText('new-1')).toBeTruthy();
    expect(screen.queryByText('rc-1')).toBeNull();
    // the modal unmounts once its exit animation completes
    await waitFor(() => expect(screen.queryByText('Generate new recovery codes?')).toBeNull());
  });
});
