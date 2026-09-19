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
import { GuardrailsPanel } from './GuardrailsPanel';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const DEFINITION = {
  ...defaultConsumer(),
  guardrails: { pii_redaction: true, input_policy: 'strict', output_policy: '', execution_mode: 'logging' as const },
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

async function shell() {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <GuardrailsPanel agentId="agent-1" />
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

describe('GuardrailsPanel', () => {
  it('renders the logging badge with the no-refusal law, never implying blocks', async () => {
    await shell();
    expect(screen.getByText(/Logging — verdicts recorded, nothing refused/)).toBeTruthy();
    expect(screen.getByText(/strict — /)).toBeTruthy();
    // Blank output resolves to the engine default name, never empty.
    expect(screen.getByText(/brand-safe/)).toBeTruthy();
    // Logging consequence promises recording, never refusal.
    expect(screen.queryByText(/refuses violating/)).toBeNull();
  });

  it('deep-links out instead of editing (read-only contract)', async () => {
    await shell();
    expect(screen.getByText(/Edit in builder/).getAttribute('href')).toMatch(/build/);
    expect(screen.getByText(/past runs keep/)).toBeTruthy();
  });
});
