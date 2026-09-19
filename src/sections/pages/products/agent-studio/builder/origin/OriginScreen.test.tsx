// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
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

  it('opens the shared gallery inline and starts installs', async () => {
    await shell();
    fireEvent.click(screen.getByText(/Browse gallery/));
    expect(screen.getByText(/support-concierge/)).toBeTruthy();
    fireEvent.click(screen.getByText('Install'));
    expect(screen.getByText(/Install support-concierge@3\.0\.0/)).toBeTruthy();
  });

  it('opens the clone picker inline', async () => {
    await shell();
    fireEvent.click(screen.getByRole('button', { name: /Pick a source/ }));
    expect(within(screen.getByRole('dialog')).getByText(/original is untouched/)).toBeTruthy();
  });

  it('opens the import pane inline with client-first validation', async () => {
    await shell();
    fireEvent.click(screen.getByRole('button', { name: /Choose a file/ }));
    expect(screen.getByLabelText(/Exported definition JSON/)).toBeTruthy();
    expect(screen.getByLabelText(/New agent name/)).toBeTruthy();
  });
});
