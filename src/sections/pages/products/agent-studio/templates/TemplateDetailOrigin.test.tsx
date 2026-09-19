// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
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
import { TemplateDetailOrigin } from './TemplateDetailOrigin';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

let versionsData = [
  { id: 'v5', version: 5, status: 'PUBLISHED', hash: 'c1', createdAt: null, publishedAt: null, publishedBy: null, rollbackOf: null, updatedAt: null, definition: null },
];
let provenanceData: { template: { slug: string; version: string; definition_hash: string | null } | null; updateAvailable?: string } | null = {
  template: { slug: 'support-concierge', version: '3.0.0', definition_hash: null },
  updateAvailable: 'minor',
};

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistantVersions: () => ({ data: versionsData }),
    useVersionProvenance: () => ({ data: provenanceData }),
    useCreateAssistant: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  };
});

vi.mock('@hooks/studio/useSetupTemplates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTemplates')>();
  return {
    ...actual,
    useAssistantTemplate: () => ({ data: { slug: 'support-concierge', version: '3.1.0', definition: {}, bindings: { tools: { required: [] }, knowledge: { required: [] }, channels: { channels: [] } } } }),
    useAssistantTemplates: () => ({
      data: [{ template: { slug: 'support-concierge', version: '3.1.0' }, available: true, compatible: true, reasons: [], installed: true, updateAvailable: 'minor' }],
    }),
  };
});

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return { ...actual, useControlBlocks: () => ({ data: [] }) };
});

async function shell() {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <TemplateDetailOrigin assistantId="agent-1" activeVersionId="v5" />
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
  versionsData = [
    { id: 'v5', version: 5, status: 'PUBLISHED', hash: 'c1', createdAt: null, publishedAt: null, publishedBy: null, rollbackOf: null, updatedAt: null, definition: null },
  ];
  provenanceData = {
    template: { slug: 'support-concierge', version: '3.0.0', definition_hash: null },
    updateAvailable: 'minor',
  };
});

describe('TemplateDetailOrigin (detail provenance + adoption)', () => {
  it('renders nothing for blank-built agents', async () => {
    provenanceData = { template: null };
    await shell();
    expect(document.body.textContent).not.toContain('Installed from a template');
  });

  it('badges the install and offers minor adoption as new', async () => {
    await shell();
    expect(screen.getByText(/support-concierge@3\.0\.0/)).toBeTruthy();
    expect(screen.getByText(/Install v3\.1\.0 as new assistant/)).toBeTruthy();
  });

  it('opens the wizard from the detail banner', async () => {
    await shell();
    fireEvent.click(screen.getByText(/Install v3\.1\.0 as new assistant/));
    expect(screen.getByText(/Install support-concierge@3\.1\.0/)).toBeTruthy();
  });
});
