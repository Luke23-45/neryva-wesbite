// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import type { ReactNode, RefObject } from 'react';
import { PurposeInspector, type PurposeHandle } from './PurposeInspector';
import { ApiError } from '@lib/engine/client';

const updateIdentityMock = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

const createIdentityMock = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());
vi.mock('react-hot-toast', () => {
  const fn = vi.fn();
  return { default: Object.assign(fn, { success: toastSuccess, error: toastError }) };
});

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({
    data: [{ id: 'agent-1', name: 'Billing Support', description: null, status: 'live', activeVersionId: 'v1', model: null, updatedAt: null, degradedUntil: null, degradedReason: null, disabledReason: null }],
    isPending: false,
    isError: false,
  }),
}));

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useCloneAssistant: () => ({ mutate: vi.fn(), isPending: false, error: null }),
    useCreateAssistant: () => ({
      mutate: createIdentityMock.mutate,
      isPending: createIdentityMock.isPending,
      error: null,
    }),
    useUpdateAssistantIdentity: () => ({
      mutate: updateIdentityMock.mutate,
      isPending: updateIdentityMock.isPending,
      error: null,
    }),
  };
});

function shell(children: ReactNode) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return router.load().then(() => {
    render(<RouterProvider router={router} />);
    return router;
  });
}

describe('PurposeInspector (new mode)', () => {
  it('renders counters and keeps Create disabled until the name is valid', async () => {
    const onFormState = vi.fn();
    await shell(
      <PurposeInspector
        mode="new"
        agentId={null}
        agentName={null}
        description={null}
        canAuthor
        role="owner"
        onFormState={onFormState}
      />,
    );
    expect(screen.getByText(/2–128 characters/)).toBeTruthy();
    expect(screen.getByText(/512/)).toBeTruthy();
    const name = screen.getByPlaceholderText('e.g. Billing concierge');
    fireEvent.change(name, { target: { value: 'A' } });
    expect(onFormState).toHaveBeenCalledWith(expect.objectContaining({ valid: false, dirty: true }));
    // The 1-char name disables creation AND says why, inline.
    expect(screen.getByText('Needs 2–128 characters')).toBeTruthy();
    fireEvent.change(name, { target: { value: 'Billing concierge' } });
    expect(onFormState).toHaveBeenCalledWith(expect.objectContaining({ valid: true, dirty: true }));
    expect(screen.queryByText('Needs 2–128 characters')).toBeNull();
  });

  it('explains viewer denial instead of silently disabling', async () => {
    await shell(
      <PurposeInspector
        mode="new"
        agentId={null}
        agentName={null}
        description={null}
        canAuthor={false}
        role="reader"
      />,
    );
    expect(screen.getByText(/Viewing only/)).toBeTruthy();
    expect(screen.getByText(/owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByPlaceholderText('e.g. Billing concierge')).toBeNull();
  });
});

describe('PurposeInspector (build mode)', () => {
  it('reads identity back with the edit affordance and the clone path', async () => {
    await shell(
      <PurposeInspector
        mode="build"
        agentId="agent-1"
        agentName="Billing Support"
        description={null}
        canAuthor
        role="owner"
      />,
    );
    expect(screen.getByText('Billing Support')).toBeTruthy();
    expect(screen.getByText(/No description yet/)).toBeTruthy();
    // The rename lock is gone — authors get the pencil instead.
    expect(screen.queryByText(/no rename verb/)).toBeNull();
    expect(screen.getByRole('button', { name: /edit agent name and description/i })).toBeTruthy();
    expect(screen.getByText('Clone agent')).toBeTruthy();
    expect(screen.getByText('Open in Engine Room')).toBeTruthy();
  });

  it('hides the edit affordance from viewers', async () => {
    await shell(
      <PurposeInspector
        mode="build"
        agentId="agent-1"
        agentName="Billing Support"
        description={null}
        canAuthor={false}
        role="reader"
      />,
    );
    expect(screen.getByText('Billing Support')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /edit agent name and description/i })).toBeNull();
  });

  it('opens the shared clone picker instead of one-shot cloning', async () => {
    const router = await shell(
      <PurposeInspector
        mode="build"
        agentId="agent-1"
        agentName="Billing Support"
        description={null}
        canAuthor
        role="owner"
      />,
    );
    fireEvent.click(screen.getByText('Clone agent'));
    // The clone action navigates to the shared clone route (with the source
    // pre-selected) — it does not clone inline.
    expect(router.state.location.pathname).toBe('/agent-studio/agents/clone');
    expect(router.state.location.search).toMatchObject({ sourceId: 'agent-1' });
  });

  it('enters edit mode with the identity prefilled and cancels cleanly', async () => {
    updateIdentityMock.mutate.mockReset();
    await shell(
      <PurposeInspector
        mode="build"
        agentId="agent-1"
        agentName="Billing Support"
        description="Handles billing questions"
        canAuthor
        role="owner"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /edit agent name and description/i }));
    // Whole identity block is editable, prefilled from the saved values.
    expect(screen.getByDisplayValue('Billing Support')).toBeTruthy();
    expect(screen.getByDisplayValue('Handles billing questions')).toBeTruthy();
    expect(screen.getByText(/2–128 characters/)).toBeTruthy();
    // Save is disabled until something actually changes.
    expect(screen.getByRole('button', { name: /save changes/i })).toHaveProperty('disabled', true);
    // Cancel discards without calling the endpoint.
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.getByText('Billing Support')).toBeTruthy();
    expect(updateIdentityMock.mutate).not.toHaveBeenCalled();
  });

  it('saves the edited identity through the update hook and exits edit mode', async () => {
    updateIdentityMock.mutate.mockReset();
    updateIdentityMock.mutate.mockImplementation((_input: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    await shell(
      <PurposeInspector
        mode="build"
        agentId="agent-1"
        agentName="Billing Support"
        description={null}
        canAuthor
        role="owner"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /edit agent name and description/i }));
    fireEvent.change(screen.getByDisplayValue('Billing Support'), { target: { value: 'Billing Concierge' } });
    fireEvent.change(screen.getByPlaceholderText('What does this agent do?'), {
      target: { value: 'Owns every billing conversation' },
    });
    const save = screen.getByRole('button', { name: /save changes/i });
    expect(save).toHaveProperty('disabled', false);
    fireEvent.click(save);
    expect(updateIdentityMock.mutate).toHaveBeenCalledWith(
      { assistantId: 'agent-1', name: 'Billing Concierge', description: 'Owns every billing conversation' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    // Success exits edit mode back to the read rows.
    expect(screen.getByText(/No description yet/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /save changes/i })).toBeNull();
  });

  it('keeps save disabled for an invalid name in edit mode', async () => {
    updateIdentityMock.mutate.mockReset();
    await shell(
      <PurposeInspector
        mode="build"
        agentId="agent-1"
        agentName="Billing Support"
        description={null}
        canAuthor
        role="owner"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /edit agent name and description/i }));
    fireEvent.change(screen.getByDisplayValue('Billing Support'), { target: { value: 'x' } });
    expect(screen.getByRole('button', { name: /save changes/i })).toHaveProperty('disabled', true);
    // The invalid name disables Save AND says why, inline.
    expect(screen.getByText('Needs 2–128 characters')).toBeTruthy();
    expect(updateIdentityMock.mutate).not.toHaveBeenCalled();
  });

  it('reports dirty while the build-mode edit form holds unsaved changes', async () => {
    const onFormState = vi.fn();
    await shell(
      <PurposeInspector
        mode="build"
        agentId="agent-1"
        agentName="Billing Support"
        description={null}
        canAuthor
        role="owner"
        onFormState={onFormState}
      />,
    );
    // Read state: nothing to save.
    expect(onFormState).toHaveBeenLastCalledWith(expect.objectContaining({ dirty: false }));
    fireEvent.click(screen.getByRole('button', { name: /edit agent name and description/i }));
    onFormState.mockClear();
    // Edit form opened, nothing typed yet — not dirty. The effect only
    // re-fires on change, so we assert no dirty:true was reported (dirty
    // was already false and stays false).
    expect(onFormState).not.toHaveBeenCalledWith(expect.objectContaining({ dirty: true }));
    fireEvent.change(screen.getByDisplayValue('Billing Support'), { target: { value: 'Billing Concierge' } });
    expect(onFormState).toHaveBeenCalledWith(expect.objectContaining({ dirty: true }));
    // Reverting to the saved value clears dirty again.
    fireEvent.change(screen.getByDisplayValue('Billing Concierge'), { target: { value: 'Billing Support' } });
    expect(onFormState).toHaveBeenLastCalledWith(expect.objectContaining({ dirty: false }));
  });

  it('recovers inline from a 409 with the one-tap suggestion', async () => {
    updateIdentityMock.mutate.mockReset();
    updateIdentityMock.mutate.mockImplementation(
      (_input: unknown, opts?: { onError?: (error: unknown) => void }) => {
        opts?.onError?.(new ApiError(409, 'conflict', 'assistant name already taken in this organization'));
      },
    );
    await shell(
      <PurposeInspector
        mode="build"
        agentId="agent-1"
        agentName="Billing Support"
        description={null}
        canAuthor
        role="owner"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /edit agent name and description/i }));
    fireEvent.change(screen.getByDisplayValue('Billing Support'), { target: { value: 'Taken Name' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    // Stays in edit mode with the inline name-taken recovery.
    expect(screen.getByText('That name is taken')).toBeTruthy();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy();
    // One tap takes the suggested free name.
    fireEvent.click(screen.getByRole('button', { name: /use “taken name 2”/i }));
    expect(screen.getByDisplayValue('Taken Name 2')).toBeTruthy();
    expect(screen.queryByText('That name is taken')).toBeNull();
  });
});

describe('PurposeInspector save handle (per-section "Save Identity")', () => {
  const buildProps = {
    mode: 'build' as const,
    agentId: 'agent-1',
    agentName: 'Billing Support',
    description: null as string | null,
    canAuthor: true,
    role: 'owner' as const,
  };

  function refShell(node: (ref: RefObject<PurposeHandle | null>) => ReactNode) {
    const ref = { current: null } as RefObject<PurposeHandle | null>;
    const rootRoute = createRootRoute();
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => (
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            {node(ref)}
          </QueryClientProvider>
        </ThemeProvider>
      ),
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    return router.load().then(() => {
      render(<RouterProvider router={router} />);
      return ref;
    });
  }

  it('new mode: save() creates through the same path as the Create verb', async () => {
    createIdentityMock.mutate.mockReset();
    const ref = await refShell((r) => (
      <PurposeInspector
        ref={r}
        mode="new"
        agentId={null}
        agentName={null}
        description={null}
        canAuthor
        role="owner"
      />
    ));
    fireEvent.change(screen.getByPlaceholderText('e.g. Billing concierge'), {
      target: { value: 'Billing concierge' },
    });
    ref.current?.save();
    expect(createIdentityMock.mutate).toHaveBeenCalledTimes(1);
    expect(createIdentityMock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Billing concierge' }),
      expect.anything(),
    );
  });

  it('new mode: save() refuses to create while the name is invalid', async () => {
    createIdentityMock.mutate.mockReset();
    const ref = await refShell((r) => (
      <PurposeInspector
        ref={r}
        mode="new"
        agentId={null}
        agentName={null}
        description={null}
        canAuthor
        role="owner"
      />
    ));
    ref.current?.save();
    expect(createIdentityMock.mutate).not.toHaveBeenCalled();
  });

  it('build read state: save() opens the editor — nothing to persist until it opens', async () => {
    updateIdentityMock.mutate.mockReset();
    const ref = await refShell((r) => <PurposeInspector ref={r} {...buildProps} />);
    expect(screen.queryByDisplayValue('Billing Support')).toBeNull();
    act(() => {
      ref.current?.save();
    });
    // The edit form opens with the identity prefilled.
    expect(screen.getByDisplayValue('Billing Support')).toBeTruthy();
    expect(updateIdentityMock.mutate).not.toHaveBeenCalled();
  });

  it('build editing with changes: save() persists through the identity PATCH path', async () => {
    updateIdentityMock.mutate.mockReset();
    const ref = await refShell((r) => <PurposeInspector ref={r} {...buildProps} />);
    act(() => {
      ref.current?.save();
    });
    fireEvent.change(screen.getByDisplayValue('Billing Support'), { target: { value: 'Billing concierge' } });
    act(() => {
      ref.current?.save();
    });
    expect(updateIdentityMock.mutate).toHaveBeenCalledTimes(1);
    expect(updateIdentityMock.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ assistantId: 'agent-1', name: 'Billing concierge' }),
      expect.anything(),
    );
  });

  it('build editing without changes: save() stays quiet — no empty PATCH', async () => {
    updateIdentityMock.mutate.mockReset();
    const ref = await refShell((r) => <PurposeInspector ref={r} {...buildProps} />);
    act(() => {
      ref.current?.save();
    });
    // Form opened, nothing typed — the edit is not dirty.
    act(() => {
      ref.current?.save();
    });
    expect(updateIdentityMock.mutate).not.toHaveBeenCalled();
  });
});

describe('PurposeInspector MetaButton hit boxes', () => {
  // The meta actions ("Clone agent", "Open in Engine Room") are SUPPOSED to
  // look small (12px caption + 6px padding ≈ 29px tall). The requirement is
  // a 44px *invisible hit area* with visuals unchanged, delivered via
  // ::after expansion. These tests assert the hit-box contract, never the
  // visible size.
  function injectedCss(): string {
    return Array.from(document.head.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n');
  }

  function afterRuleFor(button: HTMLElement): string | null {
    const css = injectedCss().replace(/\s+/g, '');
    const classTokens = (button.getAttribute('class') ?? '')
      .split(/\s+/)
      .filter((t) => t && !t.startsWith('sc-'));
    expect(classTokens.length).toBeGreaterThan(0);
    return (
      classTokens
        .map((token) => {
          const idx = css.indexOf(`.${token}::after{`);
          return idx === -1 ? null : css.slice(idx, css.indexOf('}', idx) + 1);
        })
        .find((rule) => rule !== null) ?? null
    );
  }

  it.each(['Clone agent', 'Open in Engine Room'])('%s has a 44px hit box via ::after', async (label) => {    await shell(
      <PurposeInspector
        mode="build"
        agentId="agent-1"
        agentName="Billing Support"
        description={null}
        canAuthor
        role="owner"
      />,
    );
    const button = screen.getByRole('button', { name: label });
    // MetaButton renders ~29px tall; inset -10px top/bottom -> ~49px hit box.
    expect(getComputedStyle(button).position).toBe('relative');
    const rule = afterRuleFor(button);
    expect(rule).toBeTruthy();
    expect(rule).toMatch(/content:(""|'')/);
    expect(rule).toContain('position:absolute');
    expect(rule).toContain('inset:-10px0');
  });
});

describe('PurposeInspector submission keys (Z-008) + null-id fallback (Z-010)', () => {
  type MutateCall = {
    input: { name: string; description?: string; idempotencyKey?: string };
    opts?: { onSuccess?: (r: unknown) => void; onError?: (e: unknown) => void };
  };
  const calls: MutateCall[] = [];

  function zRefShell(node: (ref: RefObject<PurposeHandle | null>) => ReactNode) {
    const ref = { current: null } as RefObject<PurposeHandle | null>;
    const rootRoute = createRootRoute();
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => (
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            {node(ref)}
          </QueryClientProvider>
        </ThemeProvider>
      ),
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    return router.load().then(() => {
      render(<RouterProvider router={router} />);
      return ref;
    });
  }

  async function submitName(name: string) {
    createIdentityMock.mutate.mockReset();
    calls.length = 0;
    toastSuccess.mockReset();
    toastError.mockReset();
    createIdentityMock.mutate.mockImplementation((input: MutateCall['input'], opts?: MutateCall['opts']) => {
      calls.push({ input, opts });
    });
    const ref = await zRefShell((r) => (
      <PurposeInspector ref={r} mode="new" agentId={null} agentName={null} description={null} canAuthor role="owner" />
    ));
    fireEvent.change(screen.getByPlaceholderText('e.g. Billing concierge'), { target: { value: name } });
    ref.current?.save();
    return ref;
  }

  it('reuses one idempotency key across retries of the same submission', async () => {
    const ref = await submitName('Billing concierge');
    ref.current?.save();
    expect(calls).toHaveLength(2);
    expect(typeof calls[0]?.input.idempotencyKey).toBe('string');
    expect(calls[0]?.input.idempotencyKey).toBe(calls[1]?.input.idempotencyKey);
  });

  it('mints a fresh key when the input changes', async () => {
    const ref = await submitName('Billing concierge');
    fireEvent.change(screen.getByPlaceholderText('e.g. Billing concierge'), {
      target: { value: 'Billing concierge!' },
    });
    ref.current?.save();
    expect(calls).toHaveLength(2);
    expect(calls[0]?.input.idempotencyKey).not.toBe(calls[1]?.input.idempotencyKey);
  });

  it('shows TakenPanel only for the name-taken code, never for idempotency codes', async () => {
    await submitName('Taken Name');
    await act(async () => {
      calls[0]?.opts?.onError?.(new ApiError(409, 'idempotency_in_flight', 'in flight'));
    });
    expect(screen.queryByText('That name is taken')).toBeNull();
    await act(async () => {
      calls[0]?.opts?.onError?.(new ApiError(409, 'conflict', 'taken'));
    });
    expect(screen.getByText('That name is taken')).toBeTruthy();
  });

  it('toasts instead of dying silent when create succeeds without an id (Z-010)', async () => {
    await submitName('Billing concierge');
    await act(async () => {
      calls[0]?.opts?.onSuccess?.({ assistantId: null, versionId: null, template: null, hash: null });
    });
    expect(toastError).toHaveBeenCalledTimes(1);
  });
});
