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
  synthetic: false,
  quota: null,
  policyRefused: false,
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

  it('shows the instructions advisory with a Purpose jump', async () => {
    const onEditJump = vi.fn();
    await shell({ definition: definitionWith(''), onEditJump });
    fireEvent.click(screen.getByText(/Edit in Purpose/));
    expect(onEditJump).toHaveBeenCalledWith('purpose');
  });

  it('blocks the run when no allowed model is usable', async () => {
    const def = definitionWith('## Role\nR.\n');
    def.model_policy.allowed_models = ['a/bad'];
    await shell({ definition: def });
    // The prereq banner AND the empty-state echo read the same blocked copy
    // (finding 2) — one coherent dead end.
    expect(screen.getAllByText(/No usable model/)).toHaveLength(2);
    fireEvent.click(screen.getByText(/Fix in Model/));
  });

  it('disables the Run button and names the blocker when no allowed model is usable (TRY-M1/1a)', async () => {
    const def = definitionWith('## Role\nR.\n');
    def.model_policy.allowed_models = ['a/bad'];
    await shell({ definition: def });
    const input = screen.getByLabelText(/Test prompt/);
    fireEvent.change(input, { target: { value: 'Hello' } });
    const button = screen.getByText(/Run test/).closest('button') as HTMLButtonElement;
    // Typed prompt, still disarmed: the same usable-model signal as the
    // prereq block wires into the button.
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('title')).toMatch(/No usable model/);
    fireEvent.click(screen.getByText(/Run test/));
    expect(sessionMock.send).not.toHaveBeenCalled();
  });

  it('keeps the Run button armed when a usable model exists (TRY-M1/1a)', async () => {
    await shell();
    const input = screen.getByLabelText(/Test prompt/);
    fireEvent.change(input, { target: { value: 'Hello' } });
    const button = screen.getByText(/Run test/).closest('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('title')).toBe('Run pinned to this version');
  });

  it('renders a singular blocked state when no usable model exists (finding 2)', async () => {
    const def = definitionWith('## Role\nR.\n');
    def.model_policy.allowed_models = ['a/bad'];
    await shell({ definition: def });
    // The prompt field is disabled with the blocked copy — it must not
    // invite input that cannot run.
    const input = screen.getByLabelText(/Test prompt/) as HTMLTextAreaElement;
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('placeholder')).toMatch(/No usable model/);
    // The thread area echoes the blocked copy instead of the "Ask anything"
    // invite — one coherent dead end, never two contradictory messages.
    expect(screen.queryByText(/Ask anything/)).toBeNull();
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

  it('Escape in the prompt field is a clean no-op — never strands the prompt (DS-2)', async () => {
    await shell();
    const input = screen.getByLabelText(/Test prompt/);
    fireEvent.change(input, { target: { value: 'half-typed prompt' } });
    input.focus();
    fireEvent.keyDown(input, { key: 'Escape' });
    // The stale Escape→blur wrapper is gone: focus stays in the field, the
    // text is untouched, and the builder keymap returns early inside fields.
    expect(document.activeElement).toBe(input);
    expect(input).toHaveValue('half-typed prompt');
  });

  it('reports terminal turns once for the canvas grade', async () => {
    const onTryEvent = vi.fn();
    sessionMock.turns = [DONE_TURN];
    await shell({ onTryEvent });
    expect(onTryEvent).toHaveBeenCalledTimes(1);
    expect(onTryEvent).toHaveBeenCalledWith(expect.objectContaining({ failed: false }));
  });

  it('reports a restored turn distinctly — never as the live lastTry (TRY-2/DS-3)', async () => {
    const onTryEvent = vi.fn();
    sessionMock.turns = [{ ...DONE_TURN, key: 'restored-conv-9', restored: true }];
    await shell({ onTryEvent });
    expect(onTryEvent).toHaveBeenCalledTimes(1);
    expect(onTryEvent).toHaveBeenCalledWith(expect.objectContaining({ failed: false, restored: true }));
  });

  it('states the audit truth with a link, never a pre-filter promise', async () => {
    await shell();
    expect(screen.getByText(/recorded in audit/)).toBeTruthy();
    expect(screen.getByText(/Open Audit/)).toBeTruthy();
  });
});

describe('TrySection demo honesty (build spec v3 §2/§3/§6)', () => {
  const DEMO_MODELS = [
    { provider: 'mock', model: 'neryva/demo', ref: 'mock/neryva/demo', usable: true },
  ];

  function demoDefinition() {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['mock/neryva/demo'];
    return { ...def, instructions: '## Role\nR.\n' };
  }

  it('shows the persistent banner and a Demo badge on synthetic turns', async () => {
    sessionMock.turns = [{ ...DONE_TURN, synthetic: true, agentText: 'This is a canned demo reply.' }];
    await shell();
    expect(screen.getByText(/You're chatting with a demo model/)).toBeTruthy();
    expect(screen.getByText('Demo')).toBeTruthy();
    expect(screen.getByText('This is a canned demo reply.')).toBeTruthy();
  });

  it('shows the banner when the demo is the only usable allowed model (no turns yet)', async () => {
    sessionMock.turns = [];
    await shell({ definition: demoDefinition(), models: DEMO_MODELS as never });
    expect(screen.getByText(/You're chatting with a demo model/)).toBeTruthy();
  });

  it('shows no banner and no badge for real-model turns', async () => {
    sessionMock.turns = [DONE_TURN];
    await shell();
    expect(screen.queryByText(/You're chatting with a demo model/)).toBeNull();
    expect(screen.queryByText('Demo')).toBeNull();
  });

  it('renders the demo limit panel with the three demo CTAs', async () => {
    sessionMock.turns = [{ ...DONE_TURN, status: 'error', agentText: '', quota: { product: 'agent_studio_demo' } }];
    await shell();
    expect(screen.getByText('Demo limit reached')).toBeTruthy();
    expect(screen.getByText('Claim free credits')).toBeTruthy();
    expect(screen.getByText('Top up')).toBeTruthy();
    expect(screen.getByText(/Connect a provider/)).toBeTruthy();
  });

  it('renders the generic paid limit panel for other quota products', async () => {
    sessionMock.turns = [{ ...DONE_TURN, status: 'error', agentText: '', quota: { product: 'agent_studio' } }];
    await shell();
    expect(screen.getByText('Usage limit reached')).toBeTruthy();
    expect(screen.getByText('Open billing')).toBeTruthy();
    expect(screen.queryByText('Demo limit reached')).toBeNull();
  });
});
