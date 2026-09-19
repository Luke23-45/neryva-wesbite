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
import { defaultConsumer } from '@lib/engine/agent-payload';
import { TemplateBanner } from './TemplateBanner';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

let provenanceData: { template: { slug: string; version: string; definition_hash: string | null } | null; updateAvailable?: string } | null = {
  template: { slug: 'support-concierge', version: '3.0.0', definition_hash: null },
};
let installedDefinition: ReturnType<typeof defaultConsumer> = { ...defaultConsumer(), instructions: 'Old instructions.' };
let liveDefinition: Record<string, unknown> = { instructions: 'New instructions.', model_policy: { allowed_models: [] } };

const createMutate = vi.fn();

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useVersionProvenance: () => ({ data: provenanceData }),
    useAssistantDefinition: () => ({ data: { definition: installedDefinition } }),
    useCreateAssistant: () => ({ mutate: createMutate, isPending: false, error: null }),
  };
});

vi.mock('@hooks/studio/useSetupTemplates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTemplates')>();
  return {
    ...actual,
    useAssistantTemplate: () => ({ data: { slug: 'support-concierge', version: '4.0.0', definition: liveDefinition, bindings: { tools: { required: [] }, knowledge: { required: [] }, channels: { channels: [] } } } }),
    useAssistantTemplates: () => ({
      data: [{ template: { slug: 'support-concierge', version: '4.0.0' }, available: true, compatible: true, reasons: [], installed: true, updateAvailable: 'major' }],
    }),
  };
});

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return { ...actual, useControlBlocks: () => ({ data: [] }) };
});

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useDocuments: () => ({ data: [], isPending: false, isError: false, refetch: vi.fn() }),
  };
});

vi.mock('@hooks/studio/useSetupTools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTools')>();
  return {
    ...actual,
    BUILT_IN_TOOLS: [],
    useToolCatalog: () => ({ data: [], isPending: false, isError: false, refetch: vi.fn() }),
  };
});

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return {
    ...actual,
    useModelAvailability: () => ({ data: [], isPending: false, isError: false, refetch: vi.fn() }),
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
          <TemplateBanner assistantId="agent-1" versionId="v3" />
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
  createMutate.mockReset();
  provenanceData = {
    template: { slug: 'support-concierge', version: '3.0.0', definition_hash: null },
    updateAvailable: 'major',
  };
});

describe('TemplateBanner (post-install map state)', () => {
  it('renders nothing for blank-built agents', async () => {
    provenanceData = { template: null };
    await shell();
    expect(document.body.textContent).not.toContain('Installed from a template');
  });

  it('badges the install and offers re-install-as-new on major', async () => {
    await shell();
    expect(screen.getByText(/support-concierge@3\.0\.0/)).toBeTruthy();
    expect(screen.getByText(/Install v4\.0\.0 as new assistant/)).toBeTruthy();
    expect(screen.getByText(/nothing auto-migrates/)).toBeTruthy();
  });

  it('diffs installed vs registry without inplace anything', async () => {
    await shell();
    fireEvent.click(screen.getByText('View changes'));
    expect(screen.getByText(/Old instructions/)).toBeTruthy();
    expect(screen.getByText(/New instructions/)).toBeTruthy();
    expect(screen.queryByText(/upgrade in place/i)).toBeNull();
  });

  it('expands the fulfillment checklist inline', async () => {
    await shell();
    fireEvent.click(screen.getByText(/Review fulfillment checklist/));
    expect(screen.getByText(/No required sources/)).toBeTruthy();
  });
});
