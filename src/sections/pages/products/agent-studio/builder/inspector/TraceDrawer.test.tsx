// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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
import { TraceDrawer, type TraceTurnView } from './TraceDrawer';

const BASE_TURN: TraceTurnView = {
  prompt: 'Where is my refund?',
  status: 'done',
  notices: [],
  stop: null,
  rawEvents: [],
};

async function shell(turn: TraceTurnView = BASE_TURN, props?: Partial<React.ComponentProps<typeof TraceDrawer>>) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <TraceDrawer
            open
            onClose={() => undefined}
            turn={turn}
            versionLabel="v3 · DRAFT"
            directiveText="You are Returns Helper."
            guardrailPolicy={{ input: 'default', output: 'brand-safe', mode: 'blocking' }}
            builderHref="/agent-studio/agents/a1/build"
            onReask={() => undefined}
            {...props}
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

afterEach(() => {
  document.body.style.overflow = '';
});

describe('TraceDrawer (reported only, never synthesized)', () => {
  it('renders reported hits as chips and states absence honestly', async () => {
    await shell();
    expect(screen.getByText(/No retrieval hits were reported/)).toBeTruthy();
    cleanup();
    await shell({
      ...BASE_TURN,
      rawEvents: [JSON.stringify({ hits: [{ title: 'returns-policy', chunk_id: 'c4', score: 0.87 }] })],
    });
    expect(screen.getByText(/returns-policy · c4 · 0\.87/)).toBeTruthy();
  });

  it('suffixes logging verdicts so they never read as blocks', async () => {
    await shell({
      ...BASE_TURN,
      rawEvents: [JSON.stringify({ policy: 'pii-redact', verdict: 'flagged' })],
      notices: [],
    });
    expect(screen.getByText(/pii-redact · flagged · blocking/)).toBeTruthy();
    cleanup();
    await shell(
      { ...BASE_TURN, rawEvents: [JSON.stringify({ policy: 'pii-redact', verdict: 'flagged' })] },
      { guardrailPolicy: { input: 'default', output: 'brand-safe', mode: 'logging' } },
    );
    expect(screen.getByText(/Logged, not blocked/)).toBeTruthy();
  });

  it('renders the wall-clock stop as its own error block, omitted when clean', async () => {
    await shell();
    expect(screen.queryByText(/budget_exceeded_wall_clock/)).toBeNull();
    cleanup();
    await shell({
      ...BASE_TURN,
      status: 'error',
      stop: {
        kind: 'wall-clock',
        headline: 'FAILED · budget_exceeded_wall_clock.',
        detail: 'The wall-clock watchdog fails the run closed.',
      },
    });
    expect(screen.getByText(/FAILED · budget_exceeded_wall_clock/)).toBeTruthy();
  });

  it('states the no-bill truth and offers re-ask only when idle', async () => {
    await shell();
    expect(screen.getByText(/write no bill row/)).toBeTruthy();
    expect(screen.getByText(/Re-ask/)).toBeTruthy();
    cleanup();
    await shell(BASE_TURN, { onReask: null });
    expect(screen.queryByText(/Re-ask/)).toBeNull();
  });

  it('jumps in builder, links out on detail', async () => {
    const onEditJump = vi.fn();
    await shell(BASE_TURN, { onEditJump, builderHref: undefined });
    fireEvent.click(screen.getAllByText(/Edit in Purpose/)[0]);
    expect(onEditJump).toHaveBeenCalledWith('purpose');
  });
});
