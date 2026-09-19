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
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { AgentTrail } from './AgentTrail';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const EVENTS = [
  { id: 'e1', actor_type: 'account', actor_id: 'u1', action: 'assistant.published', resource_type: 'assistant_version', resource_id: 'v7', details: { assistant_id: 'agent-1', version: 7, hash: 'a41f' }, created_at: '2026-09-18T14:20:00Z' },
  { id: 'e2', actor_type: 'account', actor_id: 'u1', action: 'assistant.rollout_paused', resource_type: 'assistant', resource_id: 'agent-1', details: { assistant_id: 'agent-1', reason: 'error spike, investigating' }, created_at: '2026-09-12T09:02:00Z' },
  { id: 'e3', actor_type: 'account', actor_id: 'u2', action: 'release.promoted', resource_type: 'assistant', resource_id: 'agent-9', details: { assistant_id: 'agent-9' }, created_at: '2026-09-12T08:00:00Z' },
  { id: 'e4', actor_type: 'account', actor_id: null, action: 'control.block_set', resource_type: 'control_block', resource_id: 'b1', details: { assistant_id: 'agent-1', reason: 'holiday freeze' }, created_at: '2026-08-28T16:11:00Z' },
  { id: 'e5', actor_type: 'account', actor_id: 'u1', action: 'org.member_added', resource_type: 'member', resource_id: 'm1', details: {}, created_at: '2026-08-01T10:00:00Z' },
];

const refetch = vi.fn();

vi.mock('@hooks/engine/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/engine/queries')>();
  return {
    ...actual,
    useAudit: () => ({ data: { events: EVENTS, total: EVENTS.length }, isPending: false, isError: false, refetch }),
  };
});

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return {
    ...actual,
    useMemberNameMap: () => ({ nameOf: (id: string) => (id === 'u1' ? 'Amara' : null) }),
  };
});

async function shell() {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <AgentTrail assistantId="agent-1" />
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

beforeEach(() => {
  refetch.mockReset();
});

describe('AgentTrail (C15 prefix fix)', () => {
  it('shows operate-prefixed events for this agent with reasons and actors', async () => {
    await shell();
    expect(screen.getByText('assistant.published')).toBeTruthy();
    expect(screen.getByText('assistant.rollout_paused')).toBeTruthy();
    expect(screen.getByText('control.block_set')).toBeTruthy();
    // Other agents and non-operate prefixes stay out.
    expect(screen.queryByText('release.promoted')).toBeNull();
    expect(screen.queryByText('org.member_added')).toBeNull();
    // Reasons render from known detail keys; actors resolve.
    expect(screen.getByText(/error spike, investigating/)).toBeTruthy();
    expect(screen.getByText(/holiday freeze/)).toBeTruthy();
    expect(screen.getAllByText(/Amara/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Newest 100 org events/)).toBeTruthy();
  });

  it('refreshes on demand and links the full audit', async () => {
    await shell();
    fireEvent.click(screen.getByText('Refresh'));
    expect(refetch).toHaveBeenCalled();
    expect(screen.getAllByText(/View all in Audit/).length).toBeGreaterThan(0);
  });
});
