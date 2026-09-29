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
import { LibrariesMemoryNewSection, LIBRARIES_MEMORY_NEW_ROUTE_ID } from './MemoryNewSection';
import { LibrariesMemoryDetailSection, LIBRARIES_MEMORY_DETAIL_ROUTE_ID } from './MemoryDetailSection';
import { LibrariesMemoryEditSection, LIBRARIES_MEMORY_EDIT_ROUTE_ID } from './MemoryEditSection';

let mockRole: string = 'owner';
let memoriesFail = false;
const createMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

const ROWS = [
  { id: 'm1', content: 'Ships on Fridays; freeze Thursdays', scopeType: 'organization', scopeId: null, status: null, visibility: 'organization', expiresAt: null, createdAt: '2026-09-10T00:00:00Z', sourceRef: null, provenance: 'user_authored', confidence: 1, validFrom: '2026-09-10T00:00:00Z', invalidAt: null, supersedes: null, embeddingModel: 'granted-embed-3', updatedAt: '2026-09-10T00:00:00Z' },
  { id: 'm2', content: 'Prefers morning standup notes', scopeType: 'user', scopeId: 'user-9', status: null, visibility: 'private', expiresAt: null, createdAt: '2026-09-12T00:00:00Z', sourceRef: null, provenance: 'memory_proposal', confidence: '0.920', validFrom: null, invalidAt: null, supersedes: null, embeddingModel: null, updatedAt: null },
  { id: 'm3', content: 'Assistant checkout playbook', scopeType: 'assistant', scopeId: 'agent-9', status: null, visibility: 'private', expiresAt: null, createdAt: '2026-05-01T00:00:00Z', sourceRef: null, provenance: null, confidence: null, validFrom: null, invalidAt: null, supersedes: null, embeddingModel: null, updatedAt: null },
];

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useMemories: (scopeType?: string, scopeId?: string) => ({
      data: memoriesFail ? undefined : ROWS.filter((r) => (scopeType ? r.scopeType === scopeType : true) && (scopeId ? r.scopeId === scopeId : true)),
      isPending: false,
      isError: memoriesFail,
      error: null,
      refetch: vi.fn(),
    }),
    useCreateMemory: () => ({ mutate: createMutate, isPending: false }),
    useUpdateMemory: () => ({ mutate: updateMutate, isPending: false }),
  };
});

vi.mock('@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard', () => ({
  useDirtyGuard: vi.fn(() => ({ dialog: null })),
}));

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function routerAt(initialPath: string, role = 'owner') {
  mockRole = role;
  const rootRoute = createRootRoute();
  const librariesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/memory',
    component: () => <Outlet />,
  });
  const newRoute = createRoute({
    getParentRoute: () => librariesRoute,
    path: '/new',
    component: () => shell(<LibrariesMemoryNewSection />),
  });
  const detailRoute = createRoute({
    getParentRoute: () => librariesRoute,
    path: '/$memoryId',
    component: () => shell(<LibrariesMemoryDetailSection />),
  });
  const editRoute = createRoute({
    getParentRoute: () => librariesRoute,
    path: '/$memoryId/edit',
    component: () => shell(<LibrariesMemoryEditSection />),
  });
  const listRoute = createRoute({
    getParentRoute: () => librariesRoute,
    path: '/',
    component: () => shell(<div>memory list</div>),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      librariesRoute.addChildren([listRoute, newRoute, detailRoute, editRoute]),
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(async () => {
  mockRole = 'owner';
  memoriesFail = false;
  createMutate.mockReset();
  updateMutate.mockReset();
  (await guardMock()).mockClear();
});

async function guardMock() {
  const mod = await import('@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard');
  return vi.mocked(mod.useDirtyGuard);
}

describe('libraries memory section route ids (Phase 3)', () => {
  it('exports the planned route ids', () => {
    expect(LIBRARIES_MEMORY_NEW_ROUTE_ID).toBe('/agent-studio/memory/new');
    expect(LIBRARIES_MEMORY_DETAIL_ROUTE_ID).toBe('/agent-studio/memory/$memoryId');
    expect(LIBRARIES_MEMORY_EDIT_ROUTE_ID).toBe('/agent-studio/memory/$memoryId/edit');
  });
});

describe('LibrariesMemoryNewSection', () => {
  it('renders the composer form for an author', async () => {
    await routerAt('/agent-studio/memory/new');
    expect(screen.getByRole('heading', { name: 'New memory', level: 1 })).toBeTruthy();
    expect(screen.getByLabelText('Memory content')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Organization' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'User' })).toBeTruthy();
  });

  it('bounces a reader to the memory list', async () => {
    const router = await routerAt('/agent-studio/memory/new', 'reader');
    expect(router.state.location.pathname).toBe('/agent-studio/memory');
    expect(screen.queryByLabelText('Memory content')).toBeNull();
  });

  it('enforces the 8192 cap, then saves with the chosen scope', async () => {
    createMutate.mockImplementation((_input, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());
    const router = await routerAt('/agent-studio/memory/new');
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Memory content'), { target: { value: 'x'.repeat(9000) } });
    });
    expect(screen.getByText(/9,000/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save memory' })).toHaveProperty('disabled', true);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Memory content'), { target: { value: 'User fact' } });
      fireEvent.click(screen.getByRole('tab', { name: 'User' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save memory' }));
    });
    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createMutate).mock.calls[0]?.[0]).toMatchObject({ content: 'User fact', scopeType: 'user' });
    expect(router.state.location.pathname).toBe('/agent-studio/memory');
  });

  it('arms the dirty guard while typing', async () => {
    const guard = await guardMock();
    await routerAt('/agent-studio/memory/new');
    expect(guard).toHaveBeenLastCalledWith(false, expect.any(String));
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Memory content'), { target: { value: 'draft' } });
    });
    expect(guard).toHaveBeenLastCalledWith(true, expect.any(String));
  });
});

describe('LibrariesMemoryDetailSection', () => {
  it('renders the stored row with provenance for any role', async () => {
    await routerAt('/agent-studio/memory/m1', 'reader');
    expect(screen.getByText('Memory detail')).toBeTruthy();
    expect(screen.getByText(/Ships on Fridays/)).toBeTruthy();
    expect(screen.getByText(/granted-embed-3/)).toBeTruthy();
    expect(screen.getByText('user_authored')).toBeTruthy();
  });

  it('disables Edit for readers with the named-role rule', async () => {
    await routerAt('/agent-studio/memory/m1', 'reader');
    const edit = screen.getByRole('button', { name: 'Edit' });
    expect(edit).toHaveProperty('disabled', true);
    expect(edit.getAttribute('title')).toMatch(/owner, admin, or developer/);
  });

  it('sends authors to the edit section', async () => {
    const router = await routerAt('/agent-studio/memory/m1');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/memory/m1/edit');
  });

  it('bounces an unknown id to the memory list', async () => {
    const router = await routerAt('/agent-studio/memory/nope');
    expect(router.state.location.pathname).toBe('/agent-studio/memory');
  });

  it('shows the honest error state when the read fails (no bounce, no blank page)', async () => {
    memoriesFail = true;
    const router = await routerAt('/agent-studio/memory/m1');
    expect(router.state.location.pathname).toBe('/agent-studio/memory/m1');
    expect(screen.getByText(/Could not load this memory/)).toBeTruthy();
  });
});

describe('LibrariesMemoryEditSection', () => {
  it('prefills content, hides the scope picker, and PATCHes content only', async () => {
    updateMutate.mockImplementation((_input, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());
    const router = await routerAt('/agent-studio/memory/m1/edit');
    expect(screen.getByRole('heading', { name: 'Edit memory', level: 1 })).toBeTruthy();
    expect((screen.getByLabelText('Memory content') as HTMLTextAreaElement).value).toBe(
      'Ships on Fridays; freeze Thursdays',
    );
    expect(screen.queryByRole('tab', { name: 'User' })).toBeNull();
    expect(screen.getByText(/Scope and TTL are not editable/)).toBeTruthy();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Memory content'), { target: { value: 'Ships on Mondays' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    expect(vi.mocked(updateMutate).mock.calls[0]?.[0]).toMatchObject({
      memoryId: 'm1',
      content: 'Ships on Mondays',
    });
    expect(router.state.location.pathname).toBe('/agent-studio/memory/m1');
  });

  it('bounces a reader and an unknown id to the memory list', async () => {
    const readerRouter = await routerAt('/agent-studio/memory/m1/edit', 'reader');
    expect(readerRouter.state.location.pathname).toBe('/agent-studio/memory');
    const unknownRouter = await routerAt('/agent-studio/memory/nope/edit');
    expect(unknownRouter.state.location.pathname).toBe('/agent-studio/memory');
  });

  it('bounces a failed read to the detail section, which shows the honest error', async () => {
    memoriesFail = true;
    const router = await routerAt('/agent-studio/memory/m1/edit');
    expect(router.state.location.pathname).toBe('/agent-studio/memory/m1');
    expect(screen.getByText(/Could not load this memory/)).toBeTruthy();
  });

  it('arms the dirty guard only when the content actually changes', async () => {
    const guard = await guardMock();
    await routerAt('/agent-studio/memory/m1/edit');
    expect(guard).toHaveBeenLastCalledWith(false, expect.any(String));
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Memory content'), { target: { value: 'Ships on Fridays; freeze Thursdays' } });
    });
    // Same text re-typed → not dirty.
    expect(guard).toHaveBeenLastCalledWith(false, expect.any(String));
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Memory content'), { target: { value: 'Ships on Mondays' } });
    });
    expect(guard).toHaveBeenLastCalledWith(true, expect.any(String));
  });
});
