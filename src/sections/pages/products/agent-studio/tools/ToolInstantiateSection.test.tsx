// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { ToolInstantiateSection } from './ToolInstantiateSection';
import type { ToolCatalogEntry, ToolTemplate } from '@hooks/studio/useSetupTools';

let mockRole: string = 'owner';
let mockTemplates: ToolTemplate[] = [];
let mockCatalog: ToolCatalogEntry[] = [];

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

type MutateOpts = { onSuccess?: () => void; onError?: (e: unknown) => void };
let capturedInput: unknown = null;
let capturedOpts: MutateOpts | null = null;
const instantiateMutate = vi.fn((input: unknown, opts?: MutateOpts) => {
  capturedInput = input;
  capturedOpts = opts ?? null;
});

vi.mock('@hooks/studio/useSetupTools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTools')>();
  return {
    ...actual,
    useToolTemplates: () => ({ data: mockTemplates, isPending: false, isError: false }),
    useToolCatalog: () => ({ data: mockCatalog, isPending: false, isFetching: false, isError: false }),
    useToolFromTemplate: () => ({ mutate: instantiateMutate, isPending: false }),
  };
});

function template(overrides: Partial<ToolTemplate> = {}): ToolTemplate {
  return {
    id: 'tpl-webhook',
    name: 'webhook_relay',
    description: 'Relay events',
    effectClass: 'WRITE',
    approvalRequirement: 'NONE',
    ...overrides,
  };
}

function catalogEntry(overrides: Partial<ToolCatalogEntry> = {}): ToolCatalogEntry {
  return {
    id: 't1',
    name: 'webhook_relay',
    version: 'v1',
    description: 'existing',
    effectClass: 'WRITE',
    approvalRequirement: 'NONE',
    hash: 'a'.repeat(64),
    enabled: true,
    executionEnvironment: 'sandboxed_microvm',
    allowedEgressDomains: [],
    bindingHost: 'hooks.example',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: { type: 'string' },
    rateLimitPerRun: null,
    annotations: {},
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
  // Browser history, not memory history: the installed @tanstack/history only
  // wires navigation blockers for the browser backend (memory-history block()
  // is a silent no-op there), and it is the backend the production app uses.
  window.history.replaceState(null, '', initialPath);
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/tools',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<div>tools list</div>),
  });
  const instantiateRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/instantiate',
    component: () => shell(<ToolInstantiateSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, instantiateRoute])]),
    history: createBrowserHistory(),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  mockTemplates = [template()];
  mockCatalog = [];
  capturedInput = null;
  capturedOpts = null;
  instantiateMutate.mockClear();
  sessionStorage.clear();
  localStorage.clear();
});

const URL_LABEL = 'Endpoint URL (https)';
const CRED_LABEL = 'Credential (optional — sealed per-tool, never in the manifest)';
const RATE_LABEL = 'Rate limit per run (optional)';

function instantiateButton() {
  return screen.getByText('Instantiate').closest('button')!;
}

function fillValid() {
  pickTemplate();
  fireEvent.change(screen.getByLabelText(URL_LABEL), { target: { value: 'https://hooks.example/in' } });
}

/** Drives the Template Dropdown (Apple pop-up button): opens the menu and picks the template option. */
function pickTemplate() {
  fireEvent.click(screen.getByRole('button', { name: 'Template' }));
  fireEvent.click(screen.getByRole('option', { name: /webhook_relay/ }));
}

describe('ToolInstantiateSection role gate', () => {
  it('bounces a reader to the tools list and renders nothing', async () => {
    const router = await routerAt('/agent-studio/tools/instantiate', 'reader');
    expect(router.state.location.pathname).toBe('/agent-studio/tools');
    expect(screen.queryByText('Instantiate from template')).toBeNull();
  });

  it('renders for a developer (setup:author includes developer)', async () => {
    await routerAt('/agent-studio/tools/instantiate', 'developer');
    expect(screen.getByText('Instantiate from template')).toBeTruthy();
  });
});

describe('ToolInstantiateSection form', () => {
  it('lists published templates with effect/approval context', async () => {
    await routerAt('/agent-studio/tools/instantiate');
    fireEvent.click(screen.getByRole('button', { name: 'Template' }));
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Pick a template…');
    expect(options[1].textContent).toContain('webhook_relay');
    expect(options[1].textContent).toContain('WRITE');
  });

  it('warns when the template name already exists (A4-66 upsert advisory)', async () => {
    mockCatalog = [catalogEntry()];
    await routerAt('/agent-studio/tools/instantiate');
    pickTemplate();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('webhook_relay');
    expect(alert.textContent).toContain('replaces its schema');
    // Advisory only — the button stays enabled.
    fireEvent.change(screen.getByLabelText(URL_LABEL), { target: { value: 'https://hooks.example/in' } });
    expect(instantiateButton()).not.toBeDisabled();
  });

  it('keeps Instantiate disabled until a template and an https URL are set', async () => {
    await routerAt('/agent-studio/tools/instantiate');
    expect(instantiateButton()).toBeDisabled();
    pickTemplate();
    expect(instantiateButton()).toBeDisabled();
    fireEvent.change(screen.getByLabelText(URL_LABEL), { target: { value: 'http://hooks.example/in' } });
    expect(screen.getByText('Must be an https URL.')).toBeTruthy();
    expect(instantiateButton()).toBeDisabled();
    fireEvent.change(screen.getByLabelText(URL_LABEL), { target: { value: 'https://hooks.example/in' } });
    expect(instantiateButton()).not.toBeDisabled();
  });

  it('rejects a non-numeric rate limit', async () => {
    await routerAt('/agent-studio/tools/instantiate');
    fillValid();
    fireEvent.change(screen.getByLabelText(RATE_LABEL), { target: { value: '0' } });
    expect(screen.getByText('Must be a number ≥ 1.')).toBeTruthy();
    expect(instantiateButton()).toBeDisabled();
  });

  it('submits trimmed values and returns to the list on success', async () => {
    const router = await routerAt('/agent-studio/tools/instantiate');
    fillValid();
    fireEvent.change(screen.getByLabelText(RATE_LABEL), { target: { value: '25' } });
    fireEvent.click(instantiateButton());
    expect(instantiateMutate).toHaveBeenCalledTimes(1);
    expect(capturedInput).toEqual({
      templateId: 'tpl-webhook',
      url: 'https://hooks.example/in',
      rateLimitPerRun: 25,
    });
    await act(async () => {
      capturedOpts?.onSuccess?.();
    });
    expect(router.state.location.pathname).toBe('/agent-studio/tools');
  });

  it('omits blank credential and rate limit from the payload', async () => {
    await routerAt('/agent-studio/tools/instantiate');
    fillValid();
    fireEvent.click(instantiateButton());
    expect(capturedInput).toEqual({ templateId: 'tpl-webhook', url: 'https://hooks.example/in' });
  });

  it('sends the credential when provided', async () => {
    await routerAt('/agent-studio/tools/instantiate');
    fillValid();
    fireEvent.change(screen.getByLabelText(CRED_LABEL), { target: { value: 's3cr3t' } });
    fireEvent.click(instantiateButton());
    expect(capturedInput).toEqual({
      templateId: 'tpl-webhook',
      url: 'https://hooks.example/in',
      credential: 's3cr3t',
    });
  });

  it('Cancel returns to the tools list', async () => {
    const router = await routerAt('/agent-studio/tools/instantiate');
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/tools');
  });

  it('dirty guard intercepts leaving with unsent input', async () => {
    const router = await routerAt('/agent-studio/tools/instantiate');
    fireEvent.change(screen.getByLabelText(URL_LABEL), { target: { value: 'https://hooks.example/in' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    expect(screen.getByText('Leave without saving?')).toBeTruthy();
    expect(screen.getByText(/unsent tool instantiation/)).toBeTruthy();
    expect(router.state.location.pathname).toBe('/agent-studio/tools/instantiate');
  });

  it('restores the dirty guard when the instantiation fails', async () => {
    const router = await routerAt('/agent-studio/tools/instantiate');
    fillValid();
    fireEvent.click(instantiateButton());
    expect(instantiateMutate).toHaveBeenCalledTimes(1);
    // Simulate a backend failure: the form is intact, so leaving must
    // still be intercepted.
    await act(async () => {
      capturedOpts?.onError?.(new Error('boom'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    expect(screen.getByText('Leave without saving?')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/agent-studio/tools/instantiate');
  });

  it('‹ Tools back row points at the list', async () => {
    await routerAt('/agent-studio/tools/instantiate');
    expect(screen.getByRole('link', { name: 'Tools' })).toHaveProperty(
      'href',
      expect.stringContaining('/agent-studio/tools'),
    );
  });
});
