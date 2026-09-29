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
import { ExportNewSection, MAX_EXPORT_CONVERSATIONS } from './ExportNewSection';
import { HoldNewSection } from './HoldNewSection';
import { PurgeNewSection } from './PurgeNewSection';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

let mockRole = 'owner';

function query<T>(data: T) {
  return { data, isPending: false, isError: false, refetch: vi.fn() };
}

const conversationsData = Array.from({ length: 3 }, (_, i) => ({
  id: `conv-${i + 1}`,
  title: `Conversation ${i + 1}`,
  updatedAt: `2026-09-2${i}T10:00:00Z`,
}));

vi.mock('@hooks/studio/useStudioConversations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useStudioConversations')>();
  return { ...actual, useConversations: () => query(conversationsData) };
});

const requestMutate = vi.fn();
let requestOpts: { onSuccess?: (d: { id: string; downloadToken?: string }) => void } | undefined;
const placeMutate = vi.fn();
const enqueueMutate = vi.fn();
let enqueueOpts: { onSuccess?: (d: { task?: { id: string } }) => void } | undefined;

vi.mock('@hooks/studio/useLifecycle', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useLifecycle')>();
  return {
    ...actual,
    useRequestExport: () => ({ mutate: requestMutate, isPending: false }),
    usePlaceLegalHold: () => ({ mutate: placeMutate, isPending: false }),
    useEnqueuePurge: () => ({ mutate: enqueueMutate, isPending: false }),
  };
});

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function routerAt(initialPath: string, section: 'exports' | 'holds' | 'purges') {
  const Section = section === 'exports' ? ExportNewSection : section === 'holds' ? HoldNewSection : PurgeNewSection;
  const rootRoute = createRootRoute();
  const complianceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/compliance',
    component: () => <Outlet />,
  });
  const listRoute = createRoute({
    getParentRoute: () => complianceRoute,
    path: '/',
    component: () => shell(<div>compliance list</div>),
  });
  const sectionRoute = createRoute({
    getParentRoute: () => complianceRoute,
    path: section === 'exports' ? '/exports/new' : section === 'holds' ? '/holds/new' : '/purges/new',
    component: () => shell(<Section />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([complianceRoute.addChildren([listRoute, sectionRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  requestMutate.mockReset();
  placeMutate.mockReset();
  enqueueMutate.mockReset();
  requestOpts = undefined;
  enqueueOpts = undefined;
  requestMutate.mockImplementation((_p: unknown, o?: typeof requestOpts) => { requestOpts = o; });
  enqueueMutate.mockImplementation((_p: unknown, o?: typeof enqueueOpts) => { enqueueOpts = o; });
  sessionStorage.clear();
});

describe('ExportNewSection (X-1)', () => {
  it('discloses the caps: 20-conversation ceiling, 200 messages / 50 runs, 50 most recent', async () => {
    await routerAt('/agent-studio/compliance/exports/new', 'exports');
    expect(screen.getByText(new RegExp(`Select up to ${MAX_EXPORT_CONVERSATIONS} conversations`))).toBeTruthy();
    expect(screen.getByText(/up to 200 messages and 50 runs/)).toBeTruthy();
    expect(screen.getByText(/50 most recent conversations/)).toBeTruthy();
    expect(MAX_EXPORT_CONVERSATIONS).toBe(20);
  });

  it('requests the selected conversation ids and stays for the token', async () => {
    const router = await routerAt('/agent-studio/compliance/exports/new', 'exports');
    fireEvent.click(screen.getByLabelText('Include Conversation 1'));
    fireEvent.click(screen.getByRole('button', { name: /Request export \(1\)/ }));
    expect(requestMutate).toHaveBeenCalledWith({ conversationIds: ['conv-1'] }, expect.anything());
    // No token in the response: back to the list.
    await act(async () => { requestOpts?.onSuccess?.({ id: 'exp-1' }); });
    expect(router.state.location.pathname).toBe('/agent-studio/compliance');
  });

  it('shows the one-time token modal on success and closes back to the list', async () => {
    const router = await routerAt('/agent-studio/compliance/exports/new', 'exports');
    fireEvent.click(screen.getByRole('button', { name: /Request empty export/ }));
    await act(async () => { requestOpts?.onSuccess?.({ id: 'exp-2', downloadToken: 'tok-abc-123' }); });
    expect(screen.getByText(/Download token — copy it now/)).toBeTruthy();
    expect(screen.getByText('tok-abc-123')).toBeTruthy();
    expect(sessionStorage.length).toBe(0); // token never persisted
    await act(async () => { fireEvent.click(screen.getByText('Done')); });
    expect(router.state.location.pathname).toBe('/agent-studio/compliance');
  });

  it('Cancel returns to the compliance list', async () => {
    const router = await routerAt('/agent-studio/compliance/exports/new', 'exports');
    await act(async () => { fireEvent.click(screen.getByText('Cancel')); });
    expect(router.state.location.pathname).toBe('/agent-studio/compliance');
  });
});

describe('HoldNewSection (X-4)', () => {
  it('places a hold with scope, UUID, and reason', async () => {
    const router = await routerAt('/agent-studio/compliance/holds/new', 'holds');
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    fireEvent.change(screen.getByLabelText(/Conversation id \(UUID\)/), { target: { value: uuid } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'litigation — preserve' } });
    fireEvent.click(screen.getByRole('button', { name: 'Place hold' }));
    expect(placeMutate).toHaveBeenCalledWith(
      { scopeType: 'conversation', scopeId: uuid, reason: 'litigation — preserve' },
      expect.anything(),
    );
    expect(router.state.location.pathname).toBe('/agent-studio/compliance/holds/new');
  });

  it('rejects a malformed UUID before the write', async () => {
    await routerAt('/agent-studio/compliance/holds/new', 'holds');
    fireEvent.change(screen.getByLabelText(/Conversation id \(UUID\)/), { target: { value: 'not-a-uuid' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'x' } });
    expect(screen.getByRole('button', { name: 'Place hold' })).toBeDisabled();
    expect(placeMutate).not.toHaveBeenCalled();
  });

  it('bounces non-govern roles before rendering', async () => {
    mockRole = 'viewer';
    const router = await routerAt('/agent-studio/compliance/holds/new', 'holds');
    await act(async () => {});
    expect(router.state.location.pathname).toBe('/agent-studio/compliance');
    expect(screen.queryByText('Place a legal hold')).toBeNull();
  });
});

describe('PurgeNewSection (X-6)', () => {
  it('enqueues with the UUID + reason vocabulary and threads the task id back', async () => {
    const router = await routerAt('/agent-studio/compliance/purges/new', 'purges');
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    fireEvent.change(screen.getByLabelText(/Conversation id \(UUID\)/), { target: { value: uuid } });
    fireEvent.click(screen.getByRole('button', { name: 'Enqueue purge' }));
    expect(enqueueMutate).toHaveBeenCalledWith(
      { scopeType: 'conversation', scopeId: uuid, reason: 'user_request' },
      expect.anything(),
    );
    await act(async () => { enqueueOpts?.onSuccess?.({ task: { id: 'purge-7' } }); });
    expect(router.state.location.pathname).toBe('/agent-studio/compliance');
    expect(router.state.location.search).toMatchObject({ purgeTask: 'purge-7' });
  });

  it('warns that legal holds block the purge', async () => {
    await routerAt('/agent-studio/compliance/purges/new', 'purges');
    expect(screen.getByText(/legal holds block it/)).toBeTruthy();
  });

  it('rejects a malformed UUID before the write', async () => {
    await routerAt('/agent-studio/compliance/purges/new', 'purges');
    fireEvent.change(screen.getByLabelText(/Conversation id \(UUID\)/), { target: { value: 'zzz' } });
    expect(screen.getByRole('button', { name: 'Enqueue purge' })).toBeDisabled();
    expect(enqueueMutate).not.toHaveBeenCalled();
  });
});
