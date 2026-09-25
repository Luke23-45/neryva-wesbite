// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
import { ApprovalsView } from './ApprovalsView';
import type { ApprovalItem } from '@hooks/studio/useSetupApprovals';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const ITEMS: ApprovalItem[] = [
  { id: 'a1', runId: 'run-aaa', approvalRef: 'ORD-8814', summary: 'Refund $1,240.00', actionType: 'process_refund', policyVersion: 'v3', state: 'PENDING', expiresAt: new Date(Date.now() + 42 * 60_000).toISOString(), decidedAt: null, decisionActorId: null, createdAt: new Date(Date.now() - 12 * 60_000).toISOString(), expired: false },
  { id: 'a2', runId: null, approvalRef: null, summary: 'Orphaned approval', actionType: 'crm.delete', policyVersion: 'v3', state: 'PENDING', expiresAt: null, decidedAt: null, decisionActorId: null, createdAt: new Date(Date.now() - 60_000).toISOString(), expired: false },
  { id: 'a3', runId: 'run-ccc', approvalRef: null, summary: 'Closed refund', actionType: 'process_refund', policyVersion: 'v2', state: 'APPROVED', expiresAt: null, decidedAt: '2026-09-17T11:58:00Z', decisionActorId: 'u1', createdAt: '2026-09-17T11:40:00Z', expired: false },
];

const decideMutate = vi.fn();

vi.mock('@hooks/studio/useSetupApprovals', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupApprovals')>();
  return {
    ...actual,
    useApprovals: () => ({ data: ITEMS, isPending: false, isError: false, refetch: vi.fn() }),
    useDecideApproval: () => ({ mutate: decideMutate, isPending: false }),
    useExtendApproval: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return {
    ...actual,
    useMemberNameMap: () => ({ nameOf: (id: string) => (id === 'u1' ? 'Amara' : null) }),
  };
});

async function shell(initialEntry = '/') {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <ApprovalsView />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  decideMutate.mockReset();
});

describe('ApprovalsView (C15)', () => {
  it('shows decided history with actor and time', async () => {
    await shell();
    fireEvent.click(screen.getByText('Approved'));
    expect(screen.getByText(/Amara/)).toBeTruthy();
    expect(screen.getByText(/2026-09-17 11:58 UTC/)).toBeTruthy();
  });

  it('requires a reason to deny, and stores it', async () => {
    await shell();
    fireEvent.click(screen.getByLabelText('Deny approval a1'));
    expect(screen.getByText(/Deny requires a reason/)).toBeTruthy();
    const confirm = screen.getByText('Deny and cancel', { selector: 'button' });
    expect(confirm.hasAttribute('disabled')).toBe(true);
    fireEvent.change(screen.getByPlaceholderText('Why this decision'), { target: { value: 'duplicate charge confirmed' } });
    fireEvent.click(screen.getByText('Deny and cancel', { selector: 'button' }));
    expect(decideMutate).toHaveBeenCalledWith(
      { runId: 'run-aaa', approvalId: 'a1', decision: 'DENIED', reason: 'duplicate charge confirmed' },
      expect.anything(),
    );
  });

  it('refuses to decide blind when the run is missing', async () => {
    await shell();
    fireEvent.click(screen.getByLabelText('Deny approval a2'));
    expect(screen.getByText('Cannot decide this approval')).toBeTruthy();
    expect(screen.getByText(/instead of deciding blind/)).toBeTruthy();
    expect(screen.getByText(/Open the audit trail/)).toBeTruthy();
  });

  it('opens the payload drawer with listable context, never invented args', async () => {
    await shell();
    fireEvent.click(screen.getByText('Refund $1,240.00'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('ORD-8814')).toBeTruthy();
    expect(within(dialog).getByText('v3')).toBeTruthy();
    expect(within(dialog).getByText(/run-aaa/)).toBeTruthy();
    expect(within(dialog).getByText(/expires in 4\d min/)).toBeTruthy();
  });

  it('searches loaded rows client-side', async () => {
    await shell();
    fireEvent.change(screen.getByLabelText('Search loaded approval rows'), { target: { value: 'crm.delete' } });
    expect(screen.getByText('Orphaned approval')).toBeTruthy();
    expect(screen.queryByText('Refund $1,240.00')).toBeNull();
  });

  it('writes the filter to ?state= so filtered views are shareable', async () => {
    const router = await shell();
    fireEvent.click(screen.getByText('Expired'));
    expect((router.state.location.search as Record<string, unknown>).state).toBe('EXPIRED');
    await act(async () => {});
    expect(screen.getByText('Expired', { selector: 'button' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('omits ?state= for the default Pending filter (clean addresses)', async () => {
    const router = await shell('/?state=EXPIRED');
    fireEvent.click(screen.getByText('Pending'));
    expect((router.state.location.search as Record<string, unknown>).state).toBeUndefined();
  });

  it('reads the initial filter from ?state=, unknown values fall back to Pending', async () => {
    await shell('/?state=DENIED');
    expect(screen.getByText('Denied', { selector: 'button' }).getAttribute('aria-pressed')).toBe('true');
    cleanup();
    await shell('/?state=BOGUS');
    expect(screen.getByText('Pending', { selector: 'button' }).getAttribute('aria-pressed')).toBe('true');
  });
});
