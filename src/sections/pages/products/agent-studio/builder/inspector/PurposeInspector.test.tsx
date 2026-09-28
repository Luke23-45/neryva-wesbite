// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
import type { ReactNode } from 'react';
import { PurposeInspector } from './PurposeInspector';
import { ApiError } from '@lib/engine/client';

const updateIdentityMock = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

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
    useCreateAssistant: () => ({ mutate: vi.fn(), isPending: false, error: null }),
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
  return router.load().then(() => render(<RouterProvider router={router} />));
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
    expect(screen.getByText(/needs 2–128/)).toBeTruthy();
    expect(screen.getByText(/512/)).toBeTruthy();
    const name = screen.getByPlaceholderText('e.g. Billing concierge');
    fireEvent.change(name, { target: { value: 'A' } });
    expect(onFormState).toHaveBeenCalledWith(expect.objectContaining({ valid: false, dirty: true }));
    fireEvent.change(name, { target: { value: 'Billing concierge' } });
    expect(onFormState).toHaveBeenCalledWith(expect.objectContaining({ valid: true, dirty: true }));
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
    expect(screen.getByText('No description yet.')).toBeTruthy();
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
    fireEvent.click(screen.getByText('Clone agent'));
    expect(screen.getByText(/original is untouched/)).toBeTruthy();
    expect(screen.getByDisplayValue('Billing Support (copy)')).toBeTruthy();
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
    expect(screen.getByText(/needs 2–128/)).toBeTruthy();
    // Save is disabled until something actually changes.
    expect(screen.getByRole('button', { name: /^save$/i })).toHaveProperty('disabled', true);
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
    fireEvent.change(screen.getByPlaceholderText('What this agent does'), {
      target: { value: 'Owns every billing conversation' },
    });
    const save = screen.getByRole('button', { name: /^save$/i });
    expect(save).toHaveProperty('disabled', false);
    fireEvent.click(save);
    expect(updateIdentityMock.mutate).toHaveBeenCalledWith(
      { assistantId: 'agent-1', name: 'Billing Concierge', description: 'Owns every billing conversation' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    // Success exits edit mode back to the read rows.
    expect(screen.getByText('No description yet.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^save$/i })).toBeNull();
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
    expect(screen.getByRole('button', { name: /^save$/i })).toHaveProperty('disabled', true);
    expect(updateIdentityMock.mutate).not.toHaveBeenCalled();
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
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    // Stays in edit mode with the inline name-taken recovery.
    expect(screen.getByText('That name is taken')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeTruthy();
    // One tap takes the suggested free name.
    fireEvent.click(screen.getByRole('button', { name: /use “taken name 2”/i }));
    expect(screen.getByDisplayValue('Taken Name 2')).toBeTruthy();
    expect(screen.queryByText('That name is taken')).toBeNull();
  });
});
