// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
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
import { defaultConsumer } from '@lib/engine/agent-payload';
import { ToolsPanel } from './ToolsPanel';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const DEFINITION = {
  ...defaultConsumer(),
  instructions: '## Role\nR.\n',
  tools: [
    { name: 'lookup_ticket', access: 'read', approval: 'never', schema_hash: 'a'.repeat(64), execution_mode: 'live' },
    { name: 'refund_payment', access: 'write', approval: 'on_effect', schema_hash: 'b'.repeat(64), execution_mode: 'shadow' },
    { name: 'ghost_tool', access: 'read', approval: 'never', execution_mode: 'live' },
  ],
};

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistantDefinition: () => ({
      data: { definition: DEFINITION, versionId: 'v3', hash: 'h3', status: 'PUBLISHED', isDraft: false },
      isPending: false,
      isFetching: false,
      isError: false,
    }),
  };
});

vi.mock('@hooks/studio/useSetupTools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTools')>();
  return {
    ...actual,
    useToolCatalog: () => ({
      data: [
        { id: 't1', name: 'lookup_ticket', version: 'v3', description: null, effectClass: 'READ_ONLY', approvalRequirement: 'NONE', hash: 'a'.repeat(64), enabled: true, executionEnvironment: null, allowedEgressDomains: null, bindingHost: null },
        { id: 't2', name: 'refund_payment', version: 'v2', description: null, effectClass: 'DESTRUCTIVE', approvalRequirement: 'REQUIRED', hash: 'b'.repeat(64), enabled: true, executionEnvironment: null, allowedEgressDomains: null, bindingHost: null },
      ],
      isPending: false,
      isError: false,
    }),
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
          <ToolsPanel agentId="agent-1" />
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

describe('ToolsPanel', () => {
  it('renders entries with authorize-time modes and pin states', async () => {
    await shell();
    expect(screen.getByText('lookup_ticket')).toBeTruthy();
    expect(screen.getByText('refund_payment')).toBeTruthy();
    expect(screen.getByText('ghost_tool')).toBeTruthy();
    // Catalog escalation surfaces: on_effect + REQUIRED row → required (row escalates).
    expect(screen.getByText(/approval required \(row escalates\)/)).toBeTruthy();
    expect(screen.getByText(/simulated, executes nothing/)).toBeTruthy();
    expect(screen.getByText(/Not in the catalog|publish refuses|missing/)).toBeTruthy();
  });

  it('deep-links out instead of editing (read-only contract)', async () => {
    await shell();
    expect(screen.getByText(/Edit in builder/).getAttribute('href')).toMatch(/build/);
    expect(screen.getByText(/Open Tools library/).getAttribute('href')).toMatch(/tools/);
  });
});
