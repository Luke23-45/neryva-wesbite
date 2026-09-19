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
import { ApiError } from '@lib/engine/client';
import { ClonePicker } from './ClonePicker';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

let assistantsData = [
  { id: 'a1', name: 'Returns Helper', description: 'Helpdesk', status: 'live', activeVersionId: 'v1', model: null, updatedAt: '2026-09-12', degradedUntil: null, degradedReason: null, disabledReason: null },
  { id: 'a2', name: 'Billing Auditor', description: null, status: 'new', activeVersionId: null, model: null, updatedAt: null, degradedUntil: null, degradedReason: null, disabledReason: null },
];

const cloneMutate = vi.fn();
let cloneError: unknown = null;

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({ data: assistantsData, isPending: false, isError: false }),
}));

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useCloneAssistant: () => ({ mutate: cloneMutate, isPending: false, error: cloneError }),
  };
});

async function shell(props?: Partial<React.ComponentProps<typeof ClonePicker>>) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <ClonePicker open onClose={() => undefined} initialSourceId="a1" onCloned={() => undefined} {...props} />
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
  cloneMutate.mockReset();
  cloneError = null;
  window.localStorage.clear();
  assistantsData = [
    { id: 'a1', name: 'Returns Helper', description: 'Helpdesk', status: 'live', activeVersionId: 'v1', model: null, updatedAt: '2026-09-12', degradedUntil: null, degradedReason: null, disabledReason: null },
    { id: 'a2', name: 'Billing Auditor', description: null, status: 'new', activeVersionId: null, model: null, updatedAt: null, degradedUntil: null, degradedReason: null, disabledReason: null },
  ];
});

describe('ClonePicker (shared search + identity + warning)', () => {
  it('preselects the source, searches, and defaults the copy name', async () => {
    await shell();
    expect(screen.getByDisplayValue('Returns Helper (copy)')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Search agents to clone/), { target: { value: 'billing' } });
    expect(screen.queryByText('Returns Helper')).toBeNull();
    expect(screen.getByText('Billing Auditor')).toBeTruthy();
  });

  it('warns that the original is untouched, dismissibly', async () => {
    await shell();
    expect(screen.getByText(/original is untouched/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Don’t show again/));
    expect(window.localStorage.getItem('neryva.clone-copy-warning.dismissed')).toBe('1');
  });

  it('clones with the edited name and reports the landing', async () => {
    const onCloned = vi.fn();
    cloneMutate.mockImplementation((_input: unknown, options: { onSuccess?: (result: { assistantId: string }) => void }) => {
      options.onSuccess?.({ assistantId: 'a9' });
    });
    await shell({ onCloned });
    fireEvent.change(screen.getByDisplayValue('Returns Helper (copy)'), { target: { value: 'Returns 2' } });
    fireEvent.click(screen.getByText('Clone agent'));
    expect(cloneMutate).toHaveBeenCalledWith(
      expect.objectContaining({ assistantId: 'a1', name: 'Returns 2' }),
      expect.anything(),
    );
    expect(onCloned).toHaveBeenCalledWith('a9', 'Returns 2');
  });

  it('recovers 409 collisions with one-tap rename', async () => {
    cloneError = new ApiError(409, 'conflict', 'assistant name already taken');
    cloneMutate.mockImplementation((_input: unknown, options: { onError?: (error: unknown) => void }) => {
      options.onError?.(cloneError);
    });
    await shell();
    fireEvent.click(screen.getByText('Clone agent'));
    expect(screen.getByText(/Use “Returns Helper \(copy\) 2” instead/)).toBeTruthy();
  });
});
