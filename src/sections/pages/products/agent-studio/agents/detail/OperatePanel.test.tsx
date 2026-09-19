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
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { OperatePanel } from './OperatePanel';
import type { AgentVersion } from '@hooks/studio/useAgentAuthoring';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const VERSIONS: AgentVersion[] = [
  { id: 'v1', version: 1, status: 'PUBLISHED', hash: 'c11c', createdAt: '2026-09-10', publishedAt: '2026-09-10', publishedBy: 'u1', rollbackOf: null, parentVersionId: null, updatedAt: null, definition: null },
  { id: 'v2', version: 2, status: 'PUBLISHED', hash: 'b77c', createdAt: '2026-09-11', publishedAt: '2026-09-11', publishedBy: 'u1', rollbackOf: null, parentVersionId: null, updatedAt: null, definition: null },
];

const setRolloutMutate = vi.fn();
const setBlockMutate = vi.fn();

const state = {
  rollout: {
    id: 'r1',
    state: 'paused',
    environment: 'production',
    channel: 'default',
    variants: [{ version_id: 'v2', weight: 100 }],
    pausedReason: 'operator',
    pausedBy: 'u1',
    pausedAt: '2026-09-12T09:02:00Z',
    createdAt: null,
    updatedAt: null,
  },
  pointer: {
    id: 'rel1',
    state: 'active',
    environment: 'production',
    channel: 'default',
    variants: [{ version_id: 'v2', weight: 100 }],
    pausedReason: null,
    pausedBy: null,
    pausedAt: null,
    createdAt: null,
    updatedAt: null,
  },
};

function query<T>(data: T) {
  return { data, isPending: false, isError: false, refetch: vi.fn() };
}

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return {
    ...actual,
    useRollout: () => query(state.rollout),
    useSetRollout: () => ({ mutate: setRolloutMutate, isPending: false }),
    usePauseRollout: () => ({ mutate: vi.fn(), isPending: false }),
    useMoveRelease: () => ({ mutate: vi.fn(), isPending: false }),
    useReleasePointer: () => query(state.pointer),
    useControlBlocks: () => query([
      { id: 'b1', targetType: 'tool', targetName: 'refunds', reason: 'holiday freeze', expiresAt: null, createdBy: 'u1', createdAt: '2026-09-01T00:00:00Z' },
    ]),
    useSetControlBlock: () => ({ mutate: setBlockMutate, isPending: false }),
    useClearControlBlock: () => ({ mutate: vi.fn(), isPending: false }),
    useMemberNameMap: () => ({ nameOf: (id: string) => (id === 'u1' ? 'Amara' : null) }),
  };
});

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useDisableAssistant: () => ({ mutate: vi.fn(), isPending: false }),
    useEnableAssistant: () => ({ mutate: vi.fn(), isPending: false }),
    useKnowledgeHealth: () => query({ degraded: false, pins: [] }),
  };
});

vi.mock('@hooks/studio/useSetupEval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupEval')>();
  return { ...actual, useEvalRuns: () => query([]) };
});

async function shell() {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <OperatePanel agentId="agent-1" versions={VERSIONS} disabledAt={null} disabledReason={null} />
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
  setRolloutMutate.mockReset();
  setBlockMutate.mockReset();
});

describe('OperatePanel (C15)', () => {
  it('banners the manual pause with attribution and resumes at the same weights', async () => {
    await shell();
    expect(screen.getByText(/Paused by Amara/)).toBeTruthy();
    fireEvent.click(screen.getByText('Resume at same weights'));
    expect(screen.getByText(/re-posts the current variants/)).toBeTruthy();
    fireEvent.click(screen.getByText('Resume', { selector: 'button' }));
    expect(setRolloutMutate).toHaveBeenCalledWith([{ version_id: 'v2', weight: 100 }]);
  });

  it('reads the current release pointer instead of guessing it', async () => {
    await shell();
    expect(screen.getByText(/production × default/)).toBeTruthy();
    expect(screen.getByText(/→ v2/)).toBeTruthy();
  });

  it('keeps Day-1 to exactly two toggles with an audit cross-link', async () => {
    await shell();
    expect(screen.getByText('Pause rollout')).toBeTruthy();
    expect(screen.getByText('Disable agent')).toBeTruthy();
    expect(screen.getByText(/Every operate write lands in/)).toBeTruthy();
  });

  it('validates block expiry for the future via datetime-local', async () => {
    await shell();
    fireEvent.click(screen.getByText('Set block'));
    fireEvent.change(screen.getByPlaceholderText('Why this block exists'), { target: { value: 'holiday freeze' } });
    const expiry = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    expect(expiry).toBeTruthy();
    fireEvent.change(expiry, { target: { value: '2020-01-01T00:00' } });
    expect(screen.getByText(/must be in the future/)).toBeTruthy();
    fireEvent.change(expiry, { target: { value: '2030-01-01T00:00' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Set block'));
    const sent = setBlockMutate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(sent.reason).toBe('holiday freeze');
    expect(typeof sent.expiresAt).toBe('string');
    // datetime-local ships local wall time; the panel normalizes to UTC ISO.
    expect((sent.expiresAt as string).endsWith('Z')).toBe(true);
    expect(Date.parse(sent.expiresAt as string)).toBeGreaterThan(Date.now());
  });
});
