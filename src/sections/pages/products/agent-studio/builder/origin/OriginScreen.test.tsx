// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { OriginScreen } from './OriginScreen';
import type { TemplateListEntry } from '@hooks/studio/useSetupTemplates';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

function entry(): TemplateListEntry {
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
  };
}

vi.mock('@hooks/studio/useSetupTemplates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTemplates')>();
  return {
    ...actual,
    useAssistantTemplates: () => ({ data: [entry()], isPending: false, isError: false }),
  };
});

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return { ...actual, useControlBlocks: () => ({ data: [] }) };
});

vi.mock('@hooks/studio/useSetupChannels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupChannels')>();
  return { ...actual, useChannels: () => ({ data: [], isPending: false, isError: false, refetch: vi.fn() }) };
});

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useCreateAssistant: () => ({ mutate: vi.fn(), isPending: false, error: null }),
    useCloneAssistant: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  };
});

vi.mock('@hooks/studio/useAssistants', () => {
  return {
    useAssistants: () => ({
      data: [{ id: 'a1', name: 'Returns Helper', description: null, status: 'live', activeVersionId: 'v1', model: null, updatedAt: null, degradedUntil: null, degradedReason: null, disabledReason: null }],
      isPending: false,
      isError: false,
    }),
  };
});

async function shell(onBlank: () => void = () => undefined) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <OriginScreen onBlank={onBlank} />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const templateDetailProbe = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/templates/$templateId',
    component: () => <div>template detail probe</div>,
  });
  const installProbe = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/templates/$templateId/install',
    validateSearch: (search: Record<string, unknown>) => ({
      returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
      autoLand: typeof search.autoLand === 'string' ? search.autoLand : undefined,
    }),
    component: () => <div>install probe</div>,
  });
  const cloneProbe = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/agents/clone',
    validateSearch: (search: Record<string, unknown>) => ({
      returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
    }),
    component: () => <div>clone probe</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, templateDetailProbe, installProbe, cloneProbe]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

describe('OriginScreen (builder pre-circuit choice)', () => {
  it('offers all four paths with install-never-live honesty', async () => {
    const onBlank = vi.fn();
    await shell(onBlank);
    expect(screen.getByText(/Start from a template, a copy, a file/)).toBeTruthy();
    expect(screen.getByText(/Nothing goes live/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Name the agent/ }));
    expect(onBlank).toHaveBeenCalledTimes(1);
  });

  it('opens the shared gallery inline and routes installs to the install section', async () => {
    const router = await shell();
    fireEvent.click(screen.getByText(/Browse gallery/));
    expect(screen.getByText(/support-concierge/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText('Install'));
    });
    // The install wizard is a routed section now (R-1); the origin threads
    // autoLand=builder so a successful install lands in the builder.
    expect(router.state.location.pathname).toBe('/agent-studio/templates/support-concierge/install');
    expect(router.state.location.search).toMatchObject({ autoLand: 'builder' });
    expect(screen.getByText('install probe')).toBeTruthy();
  });

  it('routes the clone picker to the clone page', async () => {
    const router = await shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Pick a source/ }));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/agents/clone');
    expect(router.state.location.search).toMatchObject({ returnTo: '/agent-studio/agents/new' });
    expect(screen.getByText('clone probe')).toBeTruthy();
  });

  it('opens the import pane inline with client-first validation', async () => {
    await shell();
    fireEvent.click(screen.getByRole('button', { name: /Choose a file/ }));
    expect(screen.getByLabelText(/Exported definition JSON/)).toBeTruthy();
    expect(screen.getByLabelText(/New agent name/)).toBeTruthy();
  });
});
