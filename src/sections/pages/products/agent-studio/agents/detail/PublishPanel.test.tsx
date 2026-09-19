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
import { PublishPanel } from './PublishPanel';
import type { AgentVersion, PublishReadiness } from '@hooks/studio/useAgentAuthoring';
import { refusalFix } from '@/sections/pages/products/agent-studio/builder/lib/publish-model';

let role = 'owner';
vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role }),
}));

const VERSIONS: AgentVersion[] = [
  { id: 'v7', version: 7, status: 'DRAFT', hash: 'a41f9c2e', createdAt: '2026-09-18T12:00', publishedAt: null, publishedBy: null, rollbackOf: null, parentVersionId: null, updatedAt: '2026-09-18T12:00', definition: null },
  { id: 'v6', version: 6, status: 'PUBLISHED', hash: 'b77c', createdAt: '2026-09-11', publishedAt: '2026-09-11', publishedBy: 'u1', rollbackOf: null, parentVersionId: null, updatedAt: '2026-09-11', definition: null },
];

const ROWS = () =>
  ([
    { id: 'shape', title: 'Shape + instructions', detail: 'Caps pre-check passes locally.', extra: null, ok: true, ackable: false, fix: refusalFix('payload') },
    { id: 'models', title: 'Models in catalog + residency served', detail: 'Every allowed model is usable.', extra: null, ok: true, ackable: false, fix: refusalFix('models') },
    { id: 'tools', title: 'Tool pins fresh', detail: 'Built-ins cover every entry.', extra: null, ok: true, ackable: false, fix: refusalFix('tools') },
    { id: 'block', title: 'BLOCK gate', detail: 'Latest decision: PASS.', extra: null, ok: true, ackable: false, fix: refusalFix('blocked-content') },
    { id: 'required', title: 'Required checks (safety)', detail: 'A fresh PASS exists.', extra: null, ok: true, ackable: false, fix: refusalFix('required-checks') },
    { id: 'knowledge', title: 'Knowledge pins resolved', detail: 'Every pin resolves.', extra: null, ok: true, ackable: true, fix: refusalFix('degraded') },
  ]) as PublishReadiness['rows'];

let readinessOverrides: Partial<PublishReadiness> = {};
const publishMutate = vi.fn();

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    usePublishReadiness: () =>
      ({
        version: VERSIONS[0],
        activeVersion: VERSIONS[1],
        templateSlug: null,
        templateVersion: null,
        rows: ROWS(),
        verdict: 'go',
        publishable: true,
        needsAcknowledge: false,
        unresolvedSlugs: [],
        unreadySlugs: [],
        noChangeHint: false,
        requiredChecks: [],
        decision: 'PASS',
        decisionFinishedAt: '2026-09-18T14:02',
        evalRunning: false,
        isPending: false,
        isError: false,
        retry: vi.fn(),
        ...readinessOverrides,
      }) as PublishReadiness,
    usePublishVersion: () => ({ mutate: publishMutate, isPending: false }),
  };
});

async function shell(focusRequest?: { versionId: string; nonce: number }) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <PublishPanel agentId="agent-1" versions={VERSIONS} focusRequest={focusRequest} />
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
  role = 'owner';
  readinessOverrides = {};
  publishMutate.mockReset();
});

describe('PublishPanel', () => {
  it('renders the shared gate rows with a draft picker', async () => {
    await shell();
    expect(screen.getByText('Shape + instructions')).toBeTruthy();
    expect(screen.getByText('Knowledge pins resolved')).toBeTruthy();
    expect(screen.getByDisplayValue(/v7 · DRAFT/)).toBeTruthy();
  });

  it('lands version-row jumps on the gate (select + focus)', async () => {
    await shell({ versionId: 'v7', nonce: 1 });
    expect(screen.getByDisplayValue(/v7 · DRAFT/)).toBeTruthy();
    expect(document.activeElement?.id).toBe('publish-gate-panel');
  });

  it('explains the role gate to developers instead of silent-disabling', async () => {
    role = 'developer';
    await shell();
    expect(screen.getByText(/Publish needs owner or admin/)).toBeTruthy();
    expect(screen.queryByText('Publish this draft', { selector: 'button' })).toBeNull();
  });

  it('renders the no-op branch with a live-version link, never a surprise 409', async () => {
    await shell();
    fireEvent.click(screen.getByText('Publish this draft'));
    fireEvent.click(screen.getByText('Publish', { selector: 'button' }));
    const onError = publishMutate.mock.calls[0]?.[1]?.onError as ((e: unknown) => void) | undefined;
    const { ApiError } = await import('@lib/engine/client');
    act(() => {
      onError?.(new ApiError(409, 'conflict', 'assistant active version already carries this payload and resolved set', { assistant_id: 'agent-1' }));
    });
    expect(screen.getByText('No changes to publish')).toBeTruthy();
    expect(screen.getByText('View the live version →')).toBeTruthy();
  });

  it('publishes and renders the receipt with exits', async () => {
    await shell();
    fireEvent.click(screen.getByText('Publish this draft'));
    fireEvent.click(screen.getByText('Publish', { selector: 'button' }));
    const onSuccess = publishMutate.mock.calls[0]?.[1]?.onSuccess as ((r: unknown) => void) | undefined;
    act(() => {
      onSuccess?.({ id: 'v8', version: 8, hash: 'c99d' });
    });
    expect(screen.getByText(/Live — v8/)).toBeTruthy();
    expect(screen.getByText(/Connect a channel/)).toBeTruthy();
  });
});
