// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useState } from 'react';
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
    blockers: 0,
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

async function shell(ack?: { acknowledge: boolean; onAcknowledge: (b: boolean) => void }) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <ShipSection
            assistantId="agent-1"
            versionId="v7"
            role="owner"
            onEditJump={() => undefined}
            acknowledge={ack?.acknowledge ?? false}
            onAcknowledge={ack?.onAcknowledge ?? (() => undefined)}
          />
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

/** Signal-driven shell: publishSignal and the degraded ack are local state
 *  inside the route component, mirroring the builder — the consume callback
 *  resets the signal to 0 exactly like the real builder does. */
async function shellWithSignal(role: 'owner' | 'developer' = 'owner') {
  let setSignal!: (n: number) => void;
  const consumed = vi.fn();
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: function SignalRoute() {
      const [signal, _setSignal] = useState(0);
      const [ack, setAck] = useState(false);
      setSignal = _setSignal;
      return (
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <ShipSection
              assistantId="agent-1"
              versionId="v7"
              role={role}
              onEditJump={() => undefined}
              publishSignal={signal}
              onPublishSignalConsumed={() => {
                consumed();
                _setSignal(0);
              }}
              acknowledge={ack}
              onAcknowledge={setAck}
            />
          </QueryClientProvider>
        </ThemeProvider>
      );
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  const bump = async (signal: number) => {
    await act(async () => {
      setSignal(signal);
    });
  };
  return { bump, consumed };
}

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

  it('SHP-2: the degraded ack is builder-owned — checking the box calls onAcknowledge, and the confirm carries the flag', async () => {
    readiness = ROWS({
      verdict: 'conditional-go',
      publishable: true,
      blockers: 0,
      needsAcknowledge: true,
      unresolvedSlugs: ['returns-2024'],
      rows: ROWS().rows.map((row) =>
        row.id === 'knowledge' ? { ...row, ok: false as const, detail: 'Unresolved: returns-2024.' } : row,
      ),
    });
    // Stateful ack shell mirroring the builder wiring (SHP-2).
    let setAck!: (b: boolean) => void;
    const onAcknowledge = vi.fn((b: boolean) => setAck(b));
    const rootRoute = createRootRoute();
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: function AckRoute() {
        const [ack, _setAck] = useState(false);
        setAck = _setAck;
        return (
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
              <ShipSection
                assistantId="agent-1"
                versionId="v7"
                role="owner"
                onEditJump={() => undefined}
                acknowledge={ack}
                onAcknowledge={onAcknowledge}
              />
            </QueryClientProvider>
          </ThemeProvider>
        );
      },
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    expect(screen.getByText(/Conditional Go/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onAcknowledge).toHaveBeenCalledWith(true);
    // The lifted ack flows back in — publishing carries the flag.
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

  it('renders the demo publish refusal with its title and model fix — never an override', async () => {
    await shell();
    fireEvent.click(screen.getByText('Publish this draft'));
    fireEvent.click(screen.getByText('Publish', { selector: 'button' }));
    const onError = publishMutate.mock.calls[0]?.[1]?.onError as ((e: unknown) => void) | undefined;
    expect(onError).toBeTruthy();
    const { ApiError } = await import('@lib/engine/client');
    act(() => {
      onError?.(
        // 422 from the engine is `validation_failed` (EngineErrorCode has no
        // 'unprocessable' — that string was never a real engine code).
        new ApiError(422, 'validation_failed', 'This agent uses a demo model — select a real model to publish.', {
          demo_model: true,
        }),
      );
    });
    expect(screen.getByText('Cannot publish a demo model')).toBeTruthy();
    expect(screen.getByText(/This agent uses a demo model/)).toBeTruthy();
    expect(screen.getByText('Choose a real model →')).toBeTruthy();
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

  it('publishSignal opens the existing confirm flow exactly once per increment, mutation only after confirm', async () => {
    const { bump } = await shellWithSignal();
    // Idle signal: no confirm, no mutation.
    expect(screen.queryByText('Publish', { selector: 'button' })).toBeNull();
    expect(publishMutate).not.toHaveBeenCalled();

    await bump(1);
    // Confirm opened via the existing handlePublishClick — mutation still guarded.
    expect(screen.getByText('Publish', { selector: 'button' })).toBeTruthy();
    expect(publishMutate).not.toHaveBeenCalled();

    // A second increment fires once more — still one dialog, still no auto-mutation.
    await bump(2);
    expect(screen.getAllByText('Publish', { selector: 'button' })).toHaveLength(1);
    expect(publishMutate).not.toHaveBeenCalled();

    // Confirming fires the real mutation exactly once.
    fireEvent.click(screen.getByText('Publish', { selector: 'button' }));
    expect(publishMutate).toHaveBeenCalledTimes(1);
  });

  it('publishSignal never bypasses the readiness guards', async () => {
    readiness = ROWS({
      verdict: 'no-go',
      publishable: false,
      rows: ROWS().rows.map((row) => (row.id === 'models' ? { ...row, ok: false as const, detail: 'Unknown to the catalog: x/y.' } : row)),
    });
    const { bump } = await shellWithSignal();
    await bump(1);
    // Blocked: no confirm dialog, blocker notice instead, no mutation.
    expect(screen.queryByText('Publish', { selector: 'button' })).toBeNull();
    expect(screen.getByText(/Models in catalog \+ residency served — open the row to fix it/)).toBeTruthy();
    expect(publishMutate).not.toHaveBeenCalled();
  });

  it('P1-1 (T-01): a topbar publishSignal from a developer never reaches the confirm dialog or the mutation', async () => {
    const { bump } = await shellWithSignal('developer');
    // The section itself shows the honest denied copy instead of a button.
    expect(screen.getByText(/Publish needs owner or admin/)).toBeTruthy();
    expect(screen.queryByText('Publish this draft')).toBeNull();

    await bump(1);
    // Signal lands in handlePublishClick, which refuses before readiness,
    // ack, and confirm — no dialog, no mutation, no doomed 403.
    expect(screen.queryByText('Publish this draft?')).toBeNull();
    expect(publishMutate).not.toHaveBeenCalled();

    await bump(2);
    expect(screen.queryByText('Publish this draft?')).toBeNull();
    expect(publishMutate).not.toHaveBeenCalled();
  });

  it('SHP-1: the fired signal is consumed exactly once per increment — the consume re-render never re-fires', async () => {
    const { bump, consumed } = await shellWithSignal();
    await bump(1);
    expect(screen.getByText('Publish', { selector: 'button' })).toBeTruthy();
    // One fire, one consume: the signal-0 re-render from the consume must not
    // fire again (the guard re-arms to 0, and 0 > 0 is false) — otherwise the
    // section would loop or the next topbar click would dead-click.
    expect(consumed).toHaveBeenCalledTimes(1);
    expect(publishMutate).not.toHaveBeenCalled();
  });

  it('SHP-1: after the consume lands, the next increment still fires — no dead click', async () => {
    const { bump, consumed } = await shellWithSignal();
    await bump(1);
    expect(consumed).toHaveBeenCalledTimes(1);
    // Next bump re-arms (ref reset on signal 0) and fires again.
    await bump(2);
    expect(consumed).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Publish', { selector: 'button' })).toBeTruthy();
  });

  it('DS-16: clicking Publish while gates are still reading surfaces a notice, never a silent no-op', async () => {
    readiness = ROWS({ isPending: true, publishable: false, blockers: 0, rows: [] });
    await shell();
    const btn = screen.getByText('Publish this draft');
    expect(btn).toHaveAttribute('title', 'Checking gates…');
    fireEvent.click(btn);
    expect(screen.getByText(/Gates are still reading — the checks will land in a moment/)).toBeTruthy();
    expect(publishMutate).not.toHaveBeenCalled();
  });

  it('DS-18: the publish button never announces disabled while it is clickable', async () => {
    readiness = ROWS({
      verdict: 'no-go',
      publishable: false,
      blockers: 1,
      rows: ROWS().rows.map((row) => (row.id === 'models' ? { ...row, ok: false as const, detail: 'Unknown to the catalog: x/y.' } : row)),
    });
    await shell();
    const btn = screen.getByText('Publish this draft');
    expect(btn).not.toHaveAttribute('aria-disabled');
    expect(btn.getAttribute('aria-describedby')).toContain('ship-publish-hint');
  });
});
