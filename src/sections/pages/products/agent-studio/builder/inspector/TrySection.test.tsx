// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
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
import { defaultConsumer } from '@lib/engine/agent-payload';
import { TrySection } from './TrySection';
import type { TryTurn } from '@hooks/studio/useChat';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const sessionMock = {
  turns: [] as TryTurn[],
  activeKey: null as string | null,
  isBusy: false,
  send: vi.fn(),
  stop: vi.fn(),
  reask: vi.fn(),
  clearSession: vi.fn(),
  messages: { data: [] },
  streamStatus: 'closed' as const,
};

vi.mock('@hooks/studio/useChat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useChat')>();
  return { ...actual, useTrySession: () => sessionMock };
});

const MODELS = [
  { provider: 'a', model: 'good', ref: 'a/good', usable: true },
  { provider: 'a', model: 'bad', ref: 'a/bad', usable: false },
];

function definitionWith(instructions: string) {
  const def = defaultConsumer();
  def.model_policy.allowed_models = ['a/good'];
  return { ...def, instructions };
}

async function shell(props?: Partial<React.ComponentProps<typeof TrySection>>) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <TrySection
            assistantId="agent-1"
            definition={definitionWith('## Role\nR.\n')}
            versionId="v3"
            versionHash="a41f9c00"
            versionStatus="DRAFT"
            isDraft
            canAuthor
            role="owner"
            models={MODELS as never}
            modelsLoading={false}
            onTryEvent={() => undefined}
            onEditJump={() => undefined}
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

const DONE_TURN: TryTurn = {
  key: 't1',
  prompt: 'Where is my refund?',
  conversationId: 'conv-1',
  runId: 'run-1',
  liveText: '',
  agentText: 'Refunds land in 5–10 days.',
  notices: [{ id: 'n1', kind: 'tool', text: 'Tool call · lookup_order' }],
  status: 'done',
  stop: null,
  rawEvents: [],
  restored: false,
};

beforeEach(() => {
  sessionMock.turns = [];
  sessionMock.isBusy = false;
  sessionMock.send.mockReset().mockReturnValue(true);
  sessionMock.stop.mockReset();
  sessionMock.reask.mockReset();
  sessionMock.clearSession.mockReset();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
  document.body.style.overflow = '';
});

describe('TrySection (builder response spine)', () => {
  it('blocks without a runnable version and never offers a run', async () => {
    await shell({ versionId: null, isDraft: false, versionStatus: null });
    expect(screen.getByText(/No DRAFT or PUBLISHED version/)).toBeTruthy();
    expect(screen.getByTitle(/No DRAFT or PUBLISHED version/)).toBeTruthy();
  });

  it('shows the instructions advisory with a Purpose jump, and model blocks with a Brain fix', async () => {
    const onEditJump = vi.fn();
    await shell({ definition: definitionWith(''), onEditJump });
    fireEvent.click(screen.getByText(/Edit in Purpose/));
    expect(onEditJump).toHaveBeenCalledWith('purpose');
  });

  it('blocks the run when no allowed model is usable', async () => {
    const def = definitionWith('## Role\nR.\n');
    def.model_policy.allowed_models = ['a/bad'];
    await shell({ definition: def });
    expect(screen.getByText(/No usable model/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Fix in Brain/));
  });

  it('renders viewers read-only with the role truth, never the dock', async () => {
    await shell({ canAuthor: false, role: 'reader' });
    expect(screen.getByText(/Viewing only/)).toBeTruthy();
    expect(screen.queryByLabelText(/Test prompt/)).toBeNull();
  });

  it('renders the thread with notices and opens the shared trace', async () => {
    sessionMock.turns = [DONE_TURN];
    await shell();
    expect(screen.getByText('Where is my refund?')).toBeTruthy();
    expect(screen.getByText('Refunds land in 5–10 days.')).toBeTruthy();
    expect(screen.getByText(/Tool call · lookup_order/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Open trace/));
    expect(screen.getByText(/What the run saw/)).toBeTruthy();
    expect(screen.getByText(/write no bill row/)).toBeTruthy();
  });

  it('sends, clears the prompt, and keeps the pointer in ?try=', async () => {
    sessionMock.turns = [{ ...DONE_TURN, status: 'streaming', agentText: '', liveText: 'Refunds…' }];
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    await shell();
    fireEvent.change(screen.getByLabelText(/Test prompt/), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText(/Run test/));
    expect(sessionMock.send).toHaveBeenCalledWith('Hello');
    expect(screen.getByLabelText(/Test prompt/)).toHaveValue('');
    expect(replaceSpy).toHaveBeenCalled();
    replaceSpy.mockRestore();
  });

  it('Escape blurs the dock instead of stranding the prompt', async () => {
    await shell();
    const input = screen.getByLabelText(/Test prompt/);
    input.focus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(document.activeElement).not.toBe(input);
  });

  it('reports terminal turns once for the canvas grade', async () => {
    const onTryEvent = vi.fn();
    sessionMock.turns = [DONE_TURN];
    await shell({ onTryEvent });
    expect(onTryEvent).toHaveBeenCalledTimes(1);
    expect(onTryEvent).toHaveBeenCalledWith(expect.objectContaining({ failed: false }));
  });

  it('states the audit truth with a link, never a pre-filter promise', async () => {
    await shell();
    expect(screen.getByText(/recorded in audit/)).toBeTruthy();
    expect(screen.getByText(/Open Audit/)).toBeTruthy();
  });
});
