// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
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
import { TestRunPanel } from './TestRunPanel';
import type { AgentVersion } from '@hooks/studio/useAgentAuthoring';
import type { TryTurn } from '@hooks/studio/useChat';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const sessionMock = {
  turns: [] as TryTurn[],
  activeKey: null as string | null,
  isBusy: false,
  send: vi.fn(() => true),
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

const DEFINITION = { ...defaultConsumer(), instructions: '## Role\nR.\n' };

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistantDefinition: () => ({ data: { definition: DEFINITION }, isPending: false }),
  };
});

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return {
    ...actual,
    useModelAvailability: () => ({ data: [], isPending: false }),
  };
});

const VERSIONS: AgentVersion[] = [
  { id: 'v3', version: 3, status: 'DRAFT', hash: 'a41f9c00', createdAt: null, publishedAt: null, publishedBy: null, rollbackOf: null, parentVersionId: null, updatedAt: null, definition: null },
  { id: 'v2', version: 2, status: 'PUBLISHED', hash: 'b77c1d00', createdAt: null, publishedAt: null, publishedBy: null, rollbackOf: null, parentVersionId: null, updatedAt: null, definition: null },
];

async function shell(versions: AgentVersion[] = VERSIONS) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <TestRunPanel agentId="agent-1" versions={versions} />
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
  sessionMock.turns = [];
  window.history.replaceState(null, '', '/');
  document.body.style.overflow = '';
});

describe('TestRunPanel (dedicated try surface — shared console truth)', () => {
  it('asks for a draft when nothing is runnable', async () => {
    await shell([]);
    expect(screen.getByText(/No DRAFT or PUBLISHED version/)).toBeTruthy();
  });

  it('renders the version picker and the shared console dock', async () => {
    await shell();
    expect((screen.getByLabelText(/Version/) as HTMLSelectElement).value).toBe('v3');
    expect(screen.getByLabelText(/Test prompt/)).toBeTruthy();
    expect(screen.getByText('v3 · DRAFT · a41f9c00 — draft-pinned, never billable.')).toBeTruthy();
  });

  it('switching version starts a fresh thread, never another version\u2019s replay', async () => {
    await shell();
    const picker = screen.getByLabelText(/Version/) as HTMLSelectElement;
    fireEvent.change(picker, { target: { value: 'v2' } });
    expect((screen.getByLabelText(/Version/) as HTMLSelectElement).value).toBe('v2');
    expect(window.location.search).not.toContain('try=');
  });
});
