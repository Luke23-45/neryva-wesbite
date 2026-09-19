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
import { BudgetPanel } from './BudgetPanel';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const DEFINITION = {
  ...defaultConsumer(),
  model_policy: { allowed_models: ['a/good'], fallback_enabled: false },
  budget: { max_cost_cents: 500, max_total_tokens: 20_000 },
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

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return {
    ...actual,
    useModelCosts: () => ({
      data: [{ provider: 'a', model: 'good', ref: 'a/good', costMicrosPer1kInput: 3_000_000, costMicrosPer1kOutput: 15_000_000, costMicrosPer1kCachedInput: 300_000, currency: 'USD', effectiveFrom: null }],
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
          <BudgetPanel agentId="agent-1" />
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

describe('BudgetPanel', () => {
  it('renders caps, the cached price line, and the rough estimate', async () => {
    await shell();
    expect(screen.getByText(/Capped ·/)).toBeTruthy();
    expect(screen.getByText(/Spend cap/)).toBeTruthy();
    expect(screen.getByText(/\$5\.00/)).toBeTruthy();
    expect(screen.getByText(/cached-in \$0\.3000\/1k/)).toBeTruthy();
    expect(screen.getByText(/→ ~\$360\.00 per 20,000-token run \(your cap\)/)).toBeTruthy();
    expect(screen.getByText(/Rough, not the bill/)).toBeTruthy();
    expect(screen.getByText(/fails closed/)).toBeTruthy();
  });

  it('deep-links to measured spend and the builder instead of duplicating', async () => {
    await shell();
    expect(screen.getByText(/Open Usage \(measured\)/).getAttribute('href')).toMatch(/usage/);
    expect(screen.getByText(/Edit in builder/).getAttribute('href')).toMatch(/build/);
  });
});
