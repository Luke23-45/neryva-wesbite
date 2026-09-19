// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
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
import { OperateHeader } from './OperateHeader';
import type { AgentVersion } from '@hooks/studio/useAgentAuthoring';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { refusalFix } from '@/sections/pages/products/agent-studio/builder/lib/publish-model';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

function liveDefinition() {
  return { ...defaultConsumer(), model_policy: { allowed_models: ['acme/large'], fallback_enabled: false } };
}

const VERSIONS: AgentVersion[] = [
  { id: 'v5', version: 5, status: 'PUBLISHED', hash: 'e55e', createdAt: '2026-09-01', publishedAt: '2026-09-01', publishedBy: 'u1', rollbackOf: null, parentVersionId: null, updatedAt: null, definition: null },  { id: 'v6', version: 6, status: 'PUBLISHED', hash: 'b77c1d', createdAt: '2026-09-11', publishedAt: '2026-09-11', publishedBy: 'u1', rollbackOf: null, parentVersionId: null, updatedAt: null, definition: liveDefinition() },
  { id: 'v7', version: 7, status: 'DRAFT', hash: 'a41f', createdAt: '2026-09-18T12:00', publishedAt: null, publishedBy: null, rollbackOf: null, parentVersionId: 'v6', updatedAt: null, definition: null },
  { id: 'v8', version: 8, status: 'PUBLISHED', hash: 'd44e', createdAt: '2026-09-02', publishedAt: '2026-09-02', publishedBy: 'u1', rollbackOf: 'v5', parentVersionId: 'v5', updatedAt: null, definition: liveDefinition() },
];

const state = {
  rollout: null as null | {
    state: string | null;
    pausedReason: string | null;
    pausedBy: string | null;
    pausedAt: string | null;
    variants: Array<{ version_id: string; weight: number }>;
  },
  channels: [] as Array<Record<string, unknown>>,
  credentials: [] as Array<Record<string, unknown>>,
  readinessRows: [] as Array<Record<string, unknown>>,
  verdict: 'go' as string,
};

function query<T>(data: T) {
  return { data, isPending: false, isError: false, refetch: vi.fn() };
}

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return {
    ...actual,
    useRollout: () => query(state.rollout),
    useMemberNameMap: () => ({ nameOf: (id: string) => (id === 'u1' ? 'Amara' : null) }),
  };
});

vi.mock('@hooks/studio/useSetupEval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupEval')>();
  return { ...actual, useEvalRuns: () => query([]) };
});

vi.mock('@hooks/studio/useSetupChannels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupChannels')>();
  return { ...actual, useChannels: () => query(state.channels) };
});

vi.mock('@hooks/studio/useSetupProviders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupProviders')>();
  return { ...actual, useProviderCredentials: () => query(state.credentials) };
});

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    usePublishReadiness: () => ({
      version: null,
      activeVersion: null,
      templateSlug: null,
      templateVersion: null,
      rows: state.readinessRows,
      verdict: state.verdict,
      publishable: state.verdict !== 'no-go',
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
    }),
  };
});

function goRows() {
  return (['shape', 'models', 'tools', 'block', 'required', 'knowledge'] as const).map((id) => ({
    id,
    title: id,
    detail: 'passes',
    extra: null,
    ok: true,
    ackable: false,
    fix: refusalFix('payload'),
  }));
}

async function shell(props: Partial<Parameters<typeof OperateHeader>[0]> = {}) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <OperateHeader
            agentId="agent-1"
            versions={VERSIONS}
            activeVersionId="v6"
            degradedUntil={null}
            degradedReason={null}
            disabledAt={null}
            disabledReason={null}
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

beforeEach(() => {
  state.rollout = null;
  state.channels = [];
  state.credentials = [];
  state.readinessRows = goRows() as Array<Record<string, unknown>>;
  state.verdict = 'go';
});

describe('OperateHeader', () => {
  it('renders live, draft, lineage, and channels', async () => {
    state.channels = [
      { id: 'ch1', platform: 'web', displayName: 'Shop widget', publicKey: null, status: 'pending', health: {}, config: { default_assistant_id: 'agent-1' } },
      { id: 'ch2', platform: 'whatsapp', displayName: 'Other agent line', publicKey: null, status: 'active', health: {}, config: { default_assistant_id: 'agent-9' } },
    ];
    await shell();
    expect(screen.getByText('LIVE')).toBeTruthy();
    expect(screen.getByText(/Amara/)).toBeTruthy();
    expect(screen.getByText(/ready to publish/)).toBeTruthy();
    expect(screen.getByText(/child of v6/)).toBeTruthy();
    expect(screen.getByText(/restored from v5/)).toBeTruthy();
    expect(screen.getByText(/Shop widget/)).toBeTruthy();
    expect(screen.queryByText(/Other agent line/)).toBeNull();
  });

  it('banners the degrading waiver with a knowledge fix', async () => {
    await shell({ degradedUntil: new Date(Date.now() + 12 * 3_600_000).toISOString(), degradedReason: 'returns-2024' });
    expect(screen.getByText(/expires within 24 hours/)).toBeTruthy();
    expect(screen.getByText('Map the pins →')).toBeTruthy();
  });

  it('banners a manual pause with attribution and an operate jump', async () => {
    state.rollout = { state: 'paused', pausedReason: 'operator', pausedBy: 'u1', pausedAt: '2026-09-12T09:02:00Z', variants: [{ version_id: 'v6', weight: 100 }] };
    await shell();
    expect(screen.getByText(/Paused by Amara/)).toBeTruthy();
    expect(screen.getByText('Open Operate below →')).toBeTruthy();
  });

  it('resumes the draft in builder at the first blocker slot', async () => {
    state.verdict = 'no-go';
    state.readinessRows = goRows().map((row) =>
      row.id === 'models' ? { ...row, ok: false, detail: 'Unknown to the catalog.' } : row,
    ) as Array<Record<string, unknown>>;
    await shell();
    const link = screen.getByText(/Resume in builder at brain/).closest('a');
    expect(link?.getAttribute('href')).toContain('/agent-studio/agents/agent-1/build');
    expect(link?.getAttribute('href')).toContain('slot=brain');
  });

  it('flags compromised credentials on pinned providers', async () => {
    state.credentials = [{ id: 'k1', provider: 'acme', label: 'prod', compromised: true }];
    await shell();
    expect(screen.getByText(/Compromised credential on a pinned provider/)).toBeTruthy();
    expect(screen.getByText('Manage in Models →')).toBeTruthy();
  });
});
