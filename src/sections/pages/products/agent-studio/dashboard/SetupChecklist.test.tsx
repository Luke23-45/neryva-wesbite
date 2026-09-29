// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
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
  // D-09 gate-wiring tests flip this so the REAL useApprovals runs — the
  // `enabled: canReadApprovals` wiring is under test. The default (false)
  // keeps the legacy state-driven tests hermetic.
  useReal: false,
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
    // D-09 gate wiring: when `useReal` is set, delegate to the real hook so
    // the `enabled: canReadApprovals` wiring is exercised end to end.
    // Reverting the gate fires a request the reader test below forbids.
    useApprovals: (...args: Parameters<typeof actual.useApprovals>) =>
      approvalsState.useReal ? actual.useApprovals(...args) : approvalsState.value,
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
  approvalsState.useReal = false;
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

describe('SetupChecklist (D-09 gate wiring — the real useApprovals)', () => {
  // These tests run the REAL useApprovals against a stubbed engine and assert
  // on the wire: the `enabled: canReadApprovals` gate in SetupChecklist is
  // the system under test. Reverting it to `enabled: true` fires the reader
  // request and fails the first test (non-vacuity verified 2026-09-29).
  function stubFetch() {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return new Response(JSON.stringify({ approvals: [] }), { status: 200 });
      }),
    );
    return calls;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fires no approvals request for reader — the engine would 403', async () => {
    const calls = stubFetch();
    orgState.role = 'reader';
    approvalsState.useReal = true;
    await shell();
    // The panel renders (no eternal skeleton)…
    expect(await screen.findByText('Setup progress')).toBeInTheDocument();
    // …without the approvals read ever leaving the client.
    await new Promise((r) => setTimeout(r, 150));
    expect(calls.filter((c) => c.includes('/approvals'))).toHaveLength(0);
  });

  it('fires the approvals request for owner — makers are not over-blocked', async () => {
    const calls = stubFetch();
    orgState.role = 'owner';
    approvalsState.useReal = true;
    await shell();
    await waitFor(() => expect(calls.some((c) => c.includes('/approvals'))).toBe(true));
  });
});
