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
import { ShipSection } from './ShipSection';
import type { PublishReadiness } from '@hooks/studio/useAgentAuthoring';
import { refusalFix } from '../lib/publish-model';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const ROWS = (overrides: Partial<PublishReadiness> = {}) =>
  ({
    version: { id: 'v7', version: 7, status: 'DRAFT', hash: 'a41f9c2e', definition: null },
    activeVersion: null,
    templateSlug: 'returns-helper',
    templateVersion: '3',
    rows: [
      { id: 'shape', title: 'Shape + instructions', detail: 'Caps pre-check passes locally.', extra: null, ok: true, ackable: false, fix: refusalFix('payload') },
      { id: 'models', title: 'Models in catalog + residency served', detail: 'Every allowed model is usable.', extra: null, ok: true, ackable: false, fix: refusalFix('models') },
      { id: 'tools', title: 'Tool pins fresh', detail: 'Built-ins cover every entry.', extra: null, ok: true, ackable: false, fix: refusalFix('tools') },
      { id: 'block', title: 'BLOCK gate', detail: 'No completed evaluation — nothing BLOCKs.', extra: null, ok: true, ackable: false, fix: refusalFix('blocked-content') },
      { id: 'required', title: 'Required checks (none declared)', detail: 'No template-declared checks.', extra: null, ok: true, ackable: false, fix: refusalFix('required-checks') },
      { id: 'knowledge', title: 'Knowledge pins resolved', detail: 'Every pin resolves.', extra: null, ok: true, ackable: true, fix: refusalFix('degraded') },
    ],
    verdict: 'go',
    publishable: true,
    needsAcknowledge: false,
    unresolvedSlugs: [],
    unreadySlugs: [],
    noChangeHint: false,
    requiredChecks: [],
    decision: null,
    decisionFinishedAt: null,
    evalRunning: false,
    isPending: false,
    isError: false,
    retry: vi.fn(),
    ...overrides,
  }) as PublishReadiness;

let readiness: PublishReadiness = ROWS();
const publishMutate = vi.fn();

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    usePublishReadiness: () => readiness,
    usePublishVersion: () => ({ mutate: publishMutate, isPending: false }),
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
          <ShipSection assistantId="agent-1" versionId="v7" role="owner" onEditJump={() => undefined} />
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
  readiness = ROWS();
  publishMutate.mockReset();
});

describe('ShipSection', () => {
  it('renders the Go verdict with all six gate rows', async () => {
    await shell();
    expect(screen.getByText(/Go — all gates pass/)).toBeTruthy();
    expect(screen.getByText('Shape + instructions')).toBeTruthy();
    expect(screen.getByText('Tool pins fresh')).toBeTruthy();
    expect(screen.getByText('Knowledge pins resolved')).toBeTruthy();
  });

  it('scrolls to the first blocker instead of dead-clicking', async () => {
    readiness = ROWS({
      verdict: 'no-go',
      publishable: false,
      rows: ROWS().rows.map((row) => (row.id === 'models' ? { ...row, ok: false as const, detail: 'Unknown to the catalog: x/y.' } : row)),
    });
    await shell();
    expect(screen.getByText('No-Go — fix the blockers (1)')).toBeTruthy();
    fireEvent.click(screen.getByText('Publish this draft'));
    expect(screen.getByText(/Models in catalog \+ residency served — open the row to fix it/)).toBeTruthy();
    expect(publishMutate).not.toHaveBeenCalled();
  });

  it('arms the degraded ack and publishes with the flag', async () => {
    readiness = ROWS({
      verdict: 'conditional-go',
      publishable: true,
      needsAcknowledge: true,
      unresolvedSlugs: ['returns-2024'],
      rows: ROWS().rows.map((row) =>
        row.id === 'knowledge' ? { ...row, ok: false as const, detail: 'Unresolved: returns-2024.' } : row,
      ),
    });
    await shell();
    expect(screen.getByText(/Conditional Go/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Publish this draft'));
    expect(screen.getByText('Publish this draft?')).toBeTruthy();
    fireEvent.click(screen.getByText('Publish', { selector: 'button' }));
    expect(publishMutate).toHaveBeenCalledWith(
      { versionId: 'v7', acknowledgeDegradedKnowledge: true },
      expect.anything(),
    );
  });

  it('renders typed refusals verbatim with their fix', async () => {
    await shell();
    fireEvent.click(screen.getByText('Publish this draft'));
    fireEvent.click(screen.getByText('Publish', { selector: 'button' }));
    const onError = publishMutate.mock.calls[0]?.[1]?.onError as ((e: unknown) => void) | undefined;
    expect(onError).toBeTruthy();
    const { ApiError } = await import('@lib/engine/client');
    act(() => {
      onError?.(
        new ApiError(409, 'conflict', 'release policy requires a fresh PASS evaluation (checks: safety); the latest decision is absent — evaluate this version, then publish', {
          required_checks: ['safety'],
          latest_decision: null,
        }),
      );
    });
    expect(screen.getByText('Publish refused')).toBeTruthy();
    expect(screen.getByText(/requires a fresh PASS/)).toBeTruthy();
    expect(screen.getByText('Evaluate this version →')).toBeTruthy();
  });

  it('renders the success receipt with exits after publish', async () => {
    await shell();
    fireEvent.click(screen.getByText('Publish this draft'));
    fireEvent.click(screen.getByText('Publish', { selector: 'button' }));
    const onSuccess = publishMutate.mock.calls[0]?.[1]?.onSuccess as ((r: unknown) => void) | undefined;
    act(() => {
      onSuccess?.({ id: 'v8', version: 8, hash: 'c99d' });
    });
    expect(screen.getByText(/Live — v8/)).toBeTruthy();
    expect(screen.getByText(/Connect a channel/)).toBeTruthy();
    expect(screen.getByText('Watch in operate')).toBeTruthy();
    expect(screen.getByText('Back to agents')).toBeTruthy();
  });
});
