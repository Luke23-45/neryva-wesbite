// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
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
import { SetupChecklist } from './SetupChecklist';
import type { ApprovalItem } from '@hooks/studio/useSetupApprovals';

// D-09-FOLLOWUP: role varies per test, so it lives in hoisted mutable state.
const orgState = vi.hoisted(() => ({ role: 'reader' as 'reader' | 'owner' }));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: orgState.role }),
}));

const ok = <T,>(data: T) => ({
  data,
  isPending: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
});

// TanStack v5: a disabled query stays `pending` forever (data undefined,
// isPending true, isError false) — exactly the state the approvals query
// sits in for reader/billing now that it is gated on `canReadApprovals`.
const disabledApprovals = {
  data: undefined,
  isPending: true,
  isError: false,
  error: null,
  refetch: vi.fn(),
};

const approvalsState = vi.hoisted(() => ({
  value: {
    data: undefined as ApprovalItem[] | undefined,
    isPending: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as {
    data: ApprovalItem[] | undefined;
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => void;
  },
}));

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ok([]),
}));

vi.mock('@hooks/studio/useSetupKnowledge', () => ({
  useDocuments: () => ok([]),
}));

vi.mock('@hooks/studio/useSetupModels', () => ({
  useModelAvailability: () => ok([]),
}));

vi.mock('@hooks/studio/useSetupChannels', () => ({
  useChannels: () => ok([]),
}));

vi.mock('@hooks/studio/useSetupApprovals', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupApprovals')>();
  return {
    ...actual,
    useApprovals: () => approvalsState.value,
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
          <SetupChecklist />
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
  return router;
}

beforeEach(() => {
  cleanup();
  orgState.role = 'reader';
  approvalsState.value = disabledApprovals;
});

describe('SetupChecklist (D-09-FOLLOWUP)', () => {
  it('never shows an eternal skeleton for readers when the approvals query stays pending (disabled)', async () => {
    // canSetup('reader', 'setup:author') is false → the approvals query is
    // disabled and sits in `pending` forever. Before the fix the bare
    // `approvals.isPending` in the loading gate held "Setup progress" on a
    // skeleton for every reader/billing user.
    await shell();
    // The loading branch renders ONLY the skeleton (no "Setup progress"
    // text). The real panel must render instead.
    expect(screen.getByText('Setup progress')).toBeTruthy();
    // And the approvals attention row stays hidden for roles the engine
    // refuses (the wave-3 D-09 decision).
    expect(screen.queryByText(/waiting for review/)).toBeNull();
  });

  it('still shows the skeleton while approvals load for roles that can read them', async () => {
    orgState.role = 'owner';
    approvalsState.value = { ...ok<ApprovalItem[] | undefined>(undefined), isPending: true };
    await shell();
    // The fix must not delete the legitimate loading state: with an
    // enabled-but-unresolved approvals query, only the skeleton renders.
    expect(screen.queryByText('Setup progress')).toBeNull();
  });

  it('renders the approvals attention row for owners when approvals are pending', async () => {
    orgState.role = 'owner';
    approvalsState.value = ok<ApprovalItem[]>([
      {
        id: 'a1', runId: 'run-1', approvalRef: 'ORD-1', summary: 'Refund', actionType: 'process_refund',
        policyVersion: 'v3', state: 'PENDING', expiresAt: null, decidedAt: null, decisionActorId: null,
        createdAt: null, expired: false, requiredApprovals: 1, approvalsReceived: [],
      },
    ]);
    await shell();
    expect(screen.getByText('Setup progress')).toBeTruthy();
    expect(screen.getByText(/1 approval waiting for review/)).toBeTruthy();
  });
});
