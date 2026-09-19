// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { PurposeInspector } from './PurposeInspector';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({
    data: [{ id: 'agent-1', name: 'Billing Support', description: null, status: 'live', activeVersionId: 'v1', model: null, updatedAt: null, degradedUntil: null, degradedReason: null, disabledReason: null }],
    isPending: false,
    isError: false,
  }),
}));

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useCloneAssistant: () => ({ mutate: vi.fn(), isPending: false, error: null }),
    useCreateAssistant: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  };
});

function shell(children: ReactNode) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return router.load().then(() => render(<RouterProvider router={router} />));
}

describe('PurposeInspector (new mode)', () => {
  it('renders counters and keeps Create disabled until the name is valid', async () => {
    const onFormState = vi.fn();
    await shell(
      <PurposeInspector
        mode="new"
        agentId={null}
        agentName={null}
        description={null}
        canAuthor
        role="owner"
        onFormState={onFormState}
      />,
    );
    expect(screen.getByText(/needs 2–128/)).toBeTruthy();
    expect(screen.getByText(/512/)).toBeTruthy();
    const name = screen.getByPlaceholderText('e.g. Billing concierge');
    fireEvent.change(name, { target: { value: 'A' } });
    expect(onFormState).toHaveBeenCalledWith(expect.objectContaining({ valid: false, dirty: true }));
    fireEvent.change(name, { target: { value: 'Billing concierge' } });
    expect(onFormState).toHaveBeenCalledWith(expect.objectContaining({ valid: true, dirty: true }));
  });

  it('explains viewer denial instead of silently disabling', async () => {
    await shell(
      <PurposeInspector
        mode="new"
        agentId={null}
        agentName={null}
        description={null}
        canAuthor={false}
        role="reader"
      />,
    );
    expect(screen.getByText(/Viewing only/)).toBeTruthy();
    expect(screen.getByText(/owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByPlaceholderText('e.g. Billing concierge')).toBeNull();
  });
});

describe('PurposeInspector (build mode)', () => {
  it('reads identity back with the no-rename lock and the clone path', async () => {
    await shell(
      <PurposeInspector
        mode="build"
        agentId="agent-1"
        agentName="Billing Support"
        description={null}
        canAuthor
        role="owner"
      />,
    );
    expect(screen.getByText('Billing Support')).toBeTruthy();
    expect(screen.getByText('No description yet.')).toBeTruthy();
    expect(screen.getByText(/no rename verb/)).toBeTruthy();
    expect(screen.getByText('Clone agent')).toBeTruthy();
    expect(screen.getByText('Open in Engine Room')).toBeTruthy();
  });

  it('opens the shared clone picker instead of one-shot cloning', async () => {
    await shell(
      <PurposeInspector
        mode="build"
        agentId="agent-1"
        agentName="Billing Support"
        description={null}
        canAuthor
        role="owner"
      />,
    );
    fireEvent.click(screen.getByText('Clone agent'));
    expect(screen.getByText(/original is untouched/)).toBeTruthy();
    expect(screen.getByDisplayValue('Billing Support (copy)')).toBeTruthy();
  });
});
