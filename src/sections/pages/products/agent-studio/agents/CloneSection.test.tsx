// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { CloneSection } from './CloneSection';
import type { AssistantSummary } from '@hooks/studio/useAssistants';
import { ApiError } from '@/lib/engine/client';

let mockRole: string = 'owner';
let mockAssistants: AssistantSummary[] = [];

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({ data: mockAssistants, isPending: false, isError: false }),
}));

type MutateOpts = { onSuccess?: (r: { assistantId: string }) => void; onError?: (e: unknown) => void };
let capturedInput: unknown = null;
let capturedOpts: MutateOpts | null = null;
const cloneMutate = vi.fn((input: unknown, opts?: MutateOpts) => {
  capturedInput = input;
  capturedOpts = opts ?? null;
});

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useCloneAssistant: () => ({ mutate: cloneMutate, isPending: false }),
  };
});

function assistant(overrides: Partial<AssistantSummary> = {}): AssistantSummary {
  return {
    id: 'a1',
    name: 'Support bot',
    description: 'Helps customers',
    status: 'live',
    activeVersionId: 'v3',
    model: 'a/good',
    updatedAt: '2026-09-01T00:00:00Z',
    degradedUntil: null,
    degradedReason: null,
    disabledReason: null,
    ...overrides,
  };
}

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
  // Browser history, not memory history: the installed @tanstack/history only
  // wires navigation blockers for the browser backend (memory-history block()
  // is a silent no-op there), and it is the backend the production app uses.
  window.history.replaceState(null, '', initialPath);
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/agents',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<div>agents list</div>),
  });
  const newRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/new',
    component: () => shell(<div>builder origin</div>),
  });
  const cloneRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/clone',
    component: () => shell(<CloneSection />),
  });
  const buildProbe = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/agents/$agentId/build',
    component: () => shell(<div>builder</div>),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, newRoute, cloneRoute]), buildProbe]),
    history: createBrowserHistory(),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  mockAssistants = [assistant(), assistant({ id: 'a2', name: 'Billing bot', description: 'Invoices', status: 'new' })];
  capturedInput = null;
  capturedOpts = null;
  cloneMutate.mockClear();
  sessionStorage.clear();
  localStorage.clear();
});

function pickSource(name: string) {
  fireEvent.click(screen.getByText(name));
}

describe('CloneSection role gate', () => {
  it('bounces a reader to the agents list and renders nothing', async () => {
    const router = await routerAt('/agent-studio/agents/clone', 'reader');
    expect(router.state.location.pathname).toBe('/agent-studio/agents');
    expect(screen.queryByText('Clone an agent')).toBeNull();
  });

  it('renders for a developer (setup:author includes developer)', async () => {
    await routerAt('/agent-studio/agents/clone', 'developer');
    expect(screen.getByText('Clone an agent')).toBeTruthy();
  });
});

describe('CloneSection source selection', () => {
  it('preselects ?sourceId and defaults the copy name', async () => {
    await routerAt('/agent-studio/agents/clone?sourceId=a1');
    expect(screen.getByLabelText('Copy name')).toHaveValue('Support bot (copy)');
  });

  it('search filters by name and description', async () => {
    await routerAt('/agent-studio/agents/clone');
    fireEvent.change(screen.getByLabelText(/Search agents to clone/), { target: { value: 'invoice' } });
    expect(screen.queryByText('Support bot')).toBeNull();
    expect(screen.getByText('Billing bot')).toBeTruthy();
  });

  it('keeps Clone disabled until a source is picked', async () => {
    await routerAt('/agent-studio/agents/clone');
    expect(screen.getByText('Clone agent').closest('button')).toBeDisabled();
    pickSource('Support bot');
    expect(screen.getByText('Clone agent').closest('button')).not.toBeDisabled();
  });

  it('shows the untouched-original warning until dismissed', async () => {
    await routerAt('/agent-studio/agents/clone');
    // Exact WarnBox copy — the subtitle also mentions the original, so a
    // loose regex would match twice.
    expect(screen.getByText('The original is untouched — edits land on the copy.')).toBeTruthy();
  });
});

describe('CloneSection submit', () => {
  it('clones with the trimmed copy name and lands on the clone build path', async () => {
    const router = await routerAt('/agent-studio/agents/clone?sourceId=a1');
    fireEvent.change(screen.getByLabelText('Copy name'), { target: { value: '  Support bot v2 ' } });
    fireEvent.click(screen.getByText('Clone agent'));
    expect(cloneMutate).toHaveBeenCalledTimes(1);
    expect(capturedInput).toEqual({ assistantId: 'a1', name: 'Support bot v2' });
    await act(async () => {
      capturedOpts?.onSuccess?.({ assistantId: 'a9' });
    });
    expect(router.state.location.pathname).toBe('/agent-studio/agents/a9/build');
  });

  it('rejects a too-short name', async () => {
    await routerAt('/agent-studio/agents/clone?sourceId=a1');
    fireEvent.change(screen.getByLabelText('Copy name'), { target: { value: 'x' } });
    expect(screen.getByText('Names are 2–128 characters.')).toBeTruthy();
    expect(screen.getByText('Clone agent').closest('button')).toBeDisabled();
  });

  it('offers one-tap rename on 409 and applies the suggestion', async () => {
    await routerAt('/agent-studio/agents/clone?sourceId=a1');
    fireEvent.click(screen.getByText('Clone agent'));
    await act(async () => {
      capturedOpts?.onError?.(new ApiError(409, 'forbidden', 'Name already taken'));
    });
    expect(screen.getByText(/That name is taken/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Use “Support bot \(copy\) 2” instead/));
    expect(screen.getByLabelText('Copy name')).toHaveValue('Support bot (copy) 2');
  });

  it('restores the dirty guard when the clone fails', async () => {
    const router = await routerAt('/agent-studio/agents/clone?sourceId=a1');
    fireEvent.change(screen.getByLabelText('Copy name'), { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByText('Clone agent'));
    await act(async () => {
      capturedOpts?.onError?.(new Error('boom'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    expect(screen.getByText('Leave without saving?')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/agent-studio/agents/clone');
  });

  it('restores the dirty guard when the clone returns no assistant', async () => {
    const router = await routerAt('/agent-studio/agents/clone?sourceId=a1');
    fireEvent.change(screen.getByLabelText('Copy name'), { target: { value: 'Renamed' } });
    fireEvent.click(screen.getByText('Clone agent'));
    await act(async () => {
      capturedOpts?.onSuccess?.({ assistantId: '' });
    });
    // Still on the form with the typed name intact — leaving is intercepted.
    expect(router.state.location.pathname).toBe('/agent-studio/agents/clone');
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    expect(screen.getByText('Leave without saving?')).toBeTruthy();
  });
});

describe('CloneSection navigation', () => {
  it('Cancel honors a guarded ?returnTo', async () => {
    const router = await routerAt('/agent-studio/agents/clone?sourceId=a1&returnTo=/agent-studio/agents/new');
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/agents/new');
  });

  it('Cancel falls back to the agents list when ?returnTo is not an agent-studio path', async () => {
    const router = await routerAt('/agent-studio/agents/clone?sourceId=a1&returnTo=https://evil.example/x');
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/agents');
  });

  it('dirty guard intercepts leaving with a typed copy name', async () => {
    const router = await routerAt('/agent-studio/agents/clone?sourceId=a1');
    fireEvent.change(screen.getByLabelText('Copy name'), { target: { value: 'Renamed' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    expect(screen.getByText('Leave without saving?')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/agent-studio/agents/clone');
  });

  it('‹ back row points at the guarded return target', async () => {
    const router = await routerAt('/agent-studio/agents/clone?returnTo=/agent-studio/agents/new');
    // The back row keeps the section's "‹ Agents" label, pointed at returnTo.
    const back = screen.getByRole('link', { name: 'Agents' });
    expect(back).toHaveProperty('href', expect.stringContaining('/agent-studio/agents/new'));
    await act(async () => {
      fireEvent.click(back);
    });
    expect(router.state.location.pathname).toBe('/agent-studio/agents/new');
  });
});
