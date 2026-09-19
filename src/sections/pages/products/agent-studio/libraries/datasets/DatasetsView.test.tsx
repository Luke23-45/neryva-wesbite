// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
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
import { DatasetsView } from './DatasetsView';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useSetupEval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupEval')>();
  return {
    ...actual,
    useEvalDatasets: () => ({
      data: [{ id: 'd1', name: 'template:support-concierge@3', description: 'Seeded suite', createdAt: '2026-09-01' }],
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
          <DatasetsView />
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

describe('DatasetsView (C10 extends — shared origin, attach CTA)', () => {
  it('classifies origin with the shared classifier and links evaluation', async () => {
    await shell();
    expect(screen.getByText('Seeded by support-concierge@3')).toBeTruthy();
    expect(screen.getByText(/Use in evaluation/)).toBeTruthy();
    expect(screen.getByText(/add-only/)).toBeTruthy();
  });
});
