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
import toast from 'react-hot-toast';
import { ToolsView } from './ToolsView';

const setEnabledMutate = vi.fn();
const upsertMutate = vi.fn();
const fromTemplateMutate = vi.fn();

vi.mock('react-hot-toast', () => {
  const fn = vi.fn() as never;
  const success = vi.fn() as never;
  const error = vi.fn() as never;
  return { default: Object.assign(fn, { success, error }) };
});

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const CATALOG = [
  {
    id: 't1', name: 'lookup_ticket', version: 'v3', description: 'Ticket lookup', effectClass: 'READ_ONLY',
    approvalRequirement: 'NONE', hash: 'a'.repeat(64), enabled: true,
    executionEnvironment: 'sandboxed_microvm', allowedEgressDomains: ['api.crm.example'], bindingHost: 'api.crm.example',
    inputSchema: { type: 'object' }, outputSchema: null, rateLimitPerRun: null,
  },
  {
    id: 't2', name: 'refund_payment', version: 'v2', description: null, effectClass: 'DESTRUCTIVE',
    approvalRequirement: 'REQUIRED', hash: 'b'.repeat(64), enabled: true,
    executionEnvironment: 'external_gateway', allowedEgressDomains: ['pay.example'], bindingHost: 'pay.example',
    inputSchema: { type: 'object' }, outputSchema: null, rateLimitPerRun: null,
  },
];

vi.mock('@hooks/studio/useSetupTools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTools')>();
  return {
    ...actual,
    useToolCatalog: () => ({ data: CATALOG, isPending: false, isFetching: false, isError: false }),
    useToolTemplates: () => ({ data: [], isPending: false, isFetching: false, isError: false }),
    useUpsertTool: () => ({ mutate: upsertMutate, isPending: false }),
    useToolFromTemplate: () => ({ mutate: fromTemplateMutate, isPending: false }),
    useSetToolEnabled: () => ({ mutate: setEnabledMutate, isPending: false }),
  };
});

async function shell() {
  const rootRoute = createRootRoute();
  const toolsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/tools',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <ToolsView />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const newRoute = createRoute({ getParentRoute: () => toolsRoute, path: '/new', component: () => <div>new stub</div> });
  const editRoute = createRoute({ getParentRoute: () => toolsRoute, path: '/$toolId/edit', component: () => <div>edit stub</div> });
  const router = createRouter({
    routeTree: rootRoute.addChildren([toolsRoute.addChildren([newRoute, editRoute])]),
    history: createMemoryHistory({ initialEntries: ['/agent-studio/tools'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  setEnabledMutate.mockReset();
  upsertMutate.mockReset();
  fromTemplateMutate.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe('ToolsView catalog (C06)', () => {
  it('filters by name and effect, and shows the perimeter cell', async () => {
    await shell();
    expect(screen.getByText('lookup_ticket')).toBeTruthy();
    expect(screen.getByText('microvm')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('Filter by name…'), { target: { value: 'refund' } });
    expect(screen.queryByText('lookup_ticket')).toBeNull();
    expect(screen.getByText('refund_payment')).toBeTruthy();
  });

  it('expands a row drawer with full hash and perimeter truth', async () => {
    await shell();
    fireEvent.click(screen.getAllByText('Detail')[0]);
    expect(screen.getByText('a'.repeat(64))).toBeTruthy();
    expect(screen.getByText(/binding host api.crm.example/)).toBeTruthy();
  });

  it('toggles enable per row without freezing the column', async () => {
    await shell();
    fireEvent.click(screen.getByLabelText('Enable lookup_ticket'));
    expect(setEnabledMutate).toHaveBeenCalledWith(
      { name: 'lookup_ticket', enabled: false },
      expect.objectContaining({ onSettled: expect.any(Function) }),
    );
  });

  it('navigates to the register section from "New tool"', async () => {
    const router = await shell();
    fireEvent.click(screen.getByText('New tool'));
    expect(router.state.location.pathname).toBe('/agent-studio/tools/new');
  });

  it('navigates to the edit section from a row "Edit"', async () => {
    const router = await shell();
    fireEvent.click(screen.getAllByText('Edit')[0]);
    expect(router.state.location.pathname).toBe('/agent-studio/tools/lookup_ticket/edit');
  });

  it('validates the template rate limit with a named message', async () => {
    await shell();
    fireEvent.click(screen.getByText('From template'));
    fireEvent.change(screen.getByPlaceholderText('unset = platform cap'), { target: { value: '0' } });
    expect(screen.getByText('Must be a number ≥ 1.')).toBeTruthy();
    expect(screen.getByText('Instantiate').closest('button')?.disabled).toBe(true);
  });

  it('toggles "Show disabled tools" exactly once per label click', async () => {
    await shell();
    // The switch renders its own label; there must be no wrapping <label>
    // that could double-activate the toggle in real browsers.
    const toggle = screen.getByRole('switch', { name: 'Show disabled tools' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(screen.getByText('Show disabled tools'));
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByText('Show disabled tools'));
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });
});
