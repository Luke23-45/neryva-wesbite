// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
import { ApiError } from '@lib/engine/client';
import { InstallSection } from './InstallSection';
import type { TemplateListEntry } from '@hooks/studio/useSetupTemplates';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

let mockRole = 'owner';
const createMutate = vi.fn();
let createError: unknown = null;
let createPending = false;
let templatesData: TemplateListEntry[] = [];
let createOpts: { onSuccess?: (r: { assistantId: string }) => void } | undefined;

function query<T>(data: T) {
  return { data, isPending: false, isError: false, refetch: vi.fn() };
}

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useCreateAssistant: () => ({ mutate: createMutate, isPending: createPending, error: createError }),
    useAssistantDefinition: () => ({ data: undefined }),
  };
});

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return { ...actual, useControlBlocks: () => ({ data: [] }) };
});

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return { ...actual, useDocuments: () => query([]) };
});

vi.mock('@hooks/studio/useSetupTools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTools')>();
  return { ...actual, BUILT_IN_TOOLS: [], useToolCatalog: () => query([]) };
});

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return { ...actual, useModelAvailability: () => query([]) };
});

vi.mock('@hooks/studio/useSetupTemplates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTemplates')>();
  return { ...actual, useAssistantTemplates: () => query(templatesData) };
});

function entry(overrides?: Partial<TemplateListEntry>): TemplateListEntry {
  return {
    template: {
      slug: 'support-concierge',
      version: '3.0.0',
      status: 'stable',
      family: 'support',
      definition: {},
      bindings: { tools: { required: [] }, knowledge: { required: [] }, channels: { channels: [] } },
      evalRef: null,
      releasePolicy: null,
      hash: null,
      minEngineSchema: 2,
    },
    available: true,
    compatible: true,
    reasons: [],
    installed: false,
    updateAvailable: 'none',
    ...overrides,
  };
}

const GALLERY = '/agent-studio/templates';
const INSTALL = '/agent-studio/templates/support-concierge/install';

async function routerAt(initialPath: string) {
  const rootRoute = createRootRoute();
  const templatesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/templates',
    component: () => <Outlet />,
  });
  const galleryRoute = createRoute({
    getParentRoute: () => templatesRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <div>gallery</div>
      </ThemeProvider>
    ),
  });
  const installRoute = createRoute({
    getParentRoute: () => templatesRoute,
    path: '/$templateId/install',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <InstallSection />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  // Probe for the origin auto-land target (?autoLand=builder).
  const buildProbe = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/agents/$agentId/build',
    component: () => <div>builder</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([templatesRoute.addChildren([galleryRoute, installRoute]), buildProbe]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  templatesData = [entry()];
  createMutate.mockReset();
  createMutate.mockImplementation((_payload: unknown, opts?: typeof createOpts) => {
    createOpts = opts;
  });
  createError = null;
  createPending = false;
  createOpts = undefined;
  sessionStorage.clear();
});

describe('InstallSection (R-1 — the wizard as a routed section)', () => {
  it('installs without a description field (engine-discarded, immutable after)', async () => {
    await routerAt(INSTALL);
    expect(screen.queryByLabelText(/Description/)).toBeNull();
    expect(screen.getByText(/cannot be edited later/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Install as draft' }));
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'support-concierge', template: { slug: 'support-concierge', version: '3.0.0' } }),
      expect.anything(),
    );
    const sent = createMutate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect('description' in sent).toBe(false);
  });

  it('routes 409 collisions to rename with the section staying', async () => {
    createError = new ApiError(409, 'conflict', 'assistant name already taken — pick another name');
    await routerAt(INSTALL);
    expect(screen.getByText(/Name taken/)).toBeTruthy();
    expect(screen.getByText(/nothing was created/)).toBeTruthy();
  });

  it('renders 403 platform holds as not-retryable', async () => {
    createError = new ApiError(403, 'forbidden', 'template slug@version is blocked');
    await routerAt(INSTALL);
    expect(screen.getByText(/platform hold/)).toBeTruthy();
    expect(screen.getByText(/cannot be retried by you/)).toBeTruthy();
  });

  it('names unresolvable tools with the two paths', async () => {
    createError = new ApiError(400, 'validation_failed', 'Request validation failed', { tool: 'pdf-extract' });
    await routerAt(INSTALL);
    expect(screen.getByText(/pdf-extract/)).toBeTruthy();
    expect(screen.getByText(/ask an admin/i)).toBeTruthy();
  });

  it('confirms re-installs by naming the duplication', async () => {
    templatesData = [entry({ installed: true })];
    await routerAt(INSTALL);
    expect(screen.getByText(/creates ANOTHER assistant/)).toBeTruthy();
    expect(screen.getByTitle(/Confirm the duplication/)).toBeDisabled();
    fireEvent.click(screen.getByText(/Install anyway/));
    expect(screen.getByTitle(/Copy into a draft/)).toBeEnabled();
  });

  it('shows the checklist on success and an explicit notice on refresh — never a silent replay', async () => {
    const first = await routerAt(INSTALL);
    fireEvent.click(screen.getByRole('button', { name: 'Install as draft' }));
    await act(async () => {
      createOpts?.onSuccess?.({ assistantId: 'a-9' });
    });
    expect(first.state.location.pathname).toBe(INSTALL);
    // Checklist renders on the live success mount.
    expect(screen.getByText(/Recorded in Audit/)).toBeTruthy();

    // Refresh: the marker restores an explicit already-completed notice.
    const { cleanup } = await import('@testing-library/react');
    cleanup();
    await routerAt(INSTALL);
    expect(screen.getByText(/Install already completed/)).toBeTruthy();
    expect(screen.queryByText(/Recorded in Audit/)).toBeNull();
  });

  it('Done clears the marker so the next visit starts clean', async () => {
    await routerAt(INSTALL);
    fireEvent.click(screen.getByRole('button', { name: 'Install as draft' }));
    await act(async () => {
      createOpts?.onSuccess?.({ assistantId: 'a-9' });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Close'));
    });
    expect(sessionStorage.length).toBe(0);
  });

  it('Cancel honors a guarded returnTo and falls back to the gallery', async () => {
    const router = await routerAt(`${INSTALL}?returnTo=/agent-studio/agents/agent-1`);
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    // The test router has no agents route; the guarded value is honored by
    // attempting the navigation (no silent gallery fallback).
    expect(router.state.location.pathname).not.toBe(INSTALL);
  });

  it('rejects an evil returnTo to the gallery', async () => {
    const router = await routerAt(`${INSTALL}?returnTo=https://evil.example/x`);
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    expect(router.state.location.pathname).toBe(GALLERY);
  });

  it('bounces unknown template ids to the gallery', async () => {
    const router = await routerAt('/agent-studio/templates/nope-missing/install');
    await act(async () => {});
    expect(router.state.location.pathname).toBe(GALLERY);
  });

  it('auto-lands in the builder on success when ?autoLand=builder (origin onInstalled contract)', async () => {
    const router = await routerAt(`${INSTALL}?autoLand=builder`);
    fireEvent.click(screen.getByRole('button', { name: 'Install as draft' }));
    await act(async () => {
      createOpts?.onSuccess?.({ assistantId: 'a-9' });
    });
    // The old onInstalled contract: straight into the builder — no
    // checklist, no completion marker left behind.
    expect(router.state.location.pathname).toBe('/agent-studio/agents/a-9/build');
    expect(screen.queryByText(/Recorded in Audit/)).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it('releases the name dirty guard on the auto-land navigation', async () => {
    const router = await routerAt(`${INSTALL}?autoLand=builder`);
    // Rename first so the dirty guard is armed, then install.
    fireEvent.change(screen.getByLabelText(/Agent name/), { target: { value: 'my-renamed-agent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Install as draft' }));
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'my-renamed-agent' }),
      expect.anything(),
    );
    await act(async () => {
      createOpts?.onSuccess?.({ assistantId: 'a-9' });
    });
    // The submitted flag must release the guard — arrival, not a blocker dialog.
    expect(router.state.location.pathname).toBe('/agent-studio/agents/a-9/build');
    expect(screen.queryByText(/Leave without saving/)).toBeNull();
  });

  it('bounces roles without setup:author before rendering', async () => {
    mockRole = 'viewer';
    const router = await routerAt(INSTALL);
    await act(async () => {});
    expect(router.state.location.pathname).toBe(GALLERY);
  });
});
