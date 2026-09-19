// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { PublishSuccess } from './PublishSuccess';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

async function shell() {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <PublishSuccess
          receipt={{
            versionNumber: 8,
            hash: 'c99d4e21aa07f2c1',
            templateSlug: 'returns-helper',
            templateVersion: '3',
            decision: 'PASS',
            decisionFinishedAt: '2026-09-18T14:02',
            degraded: true,
            degradedSlugs: ['returns-2024'],
          }}
          agentId="agent-1"
          returnTo="/agent-studio/agents/agent-1"
        />
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

describe('PublishSuccess', () => {
  it('renders the composed receipt with all three exits and the audit link', async () => {
    await shell();
    expect(screen.getByText(/Live — v8/)).toBeTruthy();
    expect(screen.getByText(/c99d4e21aa07f2c1/)).toBeTruthy();
    expect(screen.getByText(/returns-helper @ 3/)).toBeTruthy();
    expect(screen.getByText(/PASS on c99d4e21/)).toBeTruthy();
    expect(screen.getByText(/Shipped degraded: returns-2024/)).toBeTruthy();
    expect(screen.getByText(/Connect a channel/)).toBeTruthy();
    expect(screen.getByText('Watch in operate')).toBeTruthy();
    expect(screen.getByText('Back to agents')).toBeTruthy();
    expect(screen.getByText(/Recorded in Audit/)).toBeTruthy();
  });

  it('exits toward channels with a return, operate, and agents', async () => {
    await shell();
    expect(screen.getByTitle(/Connect a platform with this agent preselected/)).toBeTruthy();
    expect(screen.getByText('Watch in operate')).toBeTruthy();
    expect(screen.getByText('Back to agents')).toBeTruthy();
  });
});
