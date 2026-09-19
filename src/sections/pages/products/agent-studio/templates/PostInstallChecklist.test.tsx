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
import { PostInstallChecklist } from './PostInstallChecklist';
import type { RegistryTemplate } from '@hooks/studio/useSetupTemplates';

let documentsState: { data?: { sourceSlug: string; state: string; latestVersion: number | null }[] | null; isPending?: boolean; isError?: boolean; refetch?: () => void } = {};
let catalogState: { data?: { name: string; enabled: boolean | null; hash: string | null }[] | null; isPending?: boolean; isError?: boolean; refetch?: () => void } = {};
let modelsState: { data?: { ref: string; usable: boolean; reasons: string[] }[] | null; isPending?: boolean; isError?: boolean; refetch?: () => void } = {};
let definitionState: { tools: { name: string; schema_hash?: string }[] } | null = { tools: [] };

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useDocuments: () => ({ data: documentsState.data ?? null, isPending: documentsState.isPending ?? false, isError: documentsState.isError ?? false, refetch: documentsState.refetch ?? vi.fn() }),
  };
});

vi.mock('@hooks/studio/useSetupTools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTools')>();
  return {
    ...actual,
    BUILT_IN_TOOLS: [],
    useToolCatalog: () => ({ data: catalogState.data ?? null, isPending: catalogState.isPending ?? false, isError: catalogState.isError ?? false, refetch: catalogState.refetch ?? vi.fn() }),
  };
});

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return {
    ...actual,
    useModelAvailability: () => ({ data: modelsState.data ?? null, isPending: modelsState.isPending ?? false, isError: modelsState.isError ?? false, refetch: modelsState.refetch ?? vi.fn() }),
  };
});

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistantDefinition: () => ({ data: definitionState ? { definition: { tools: definitionState.tools } } : undefined, isError: false, refetch: vi.fn() }),
  };
});

const TEMPLATE = {
  slug: 'support-concierge',
  version: '3.0.0',
  status: 'stable',
  family: 'support',
  definition: { model_policy: { allowed_models: ['a/good'] } },
  bindings: {
    tools: { required: [{ name: 'lookup_order' }] },
    knowledge: { required: ['help-center'] },
    channels: { channels: [] },
  },
  evalRef: null,
  releasePolicy: null,
  hash: null,
  minEngineSchema: 2,
} as unknown as RegistryTemplate;

function readyState() {
  documentsState = { data: [{ sourceSlug: 'help-center', state: 'ready', latestVersion: 3 }] };
  catalogState = { data: [{ name: 'lookup_order', enabled: true, hash: 'h1' }] };
  modelsState = { data: [{ ref: 'a/good', usable: true, reasons: [] }] };
  definitionState = { tools: [{ name: 'lookup_order', schema_hash: 'h1' }] };
}

async function shell(role: 'owner' | 'reader' = 'owner') {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <PostInstallChecklist template={TEMPLATE} assistantId="agent-1" role={role} />
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
  documentsState = {};
  catalogState = {};
  modelsState = {};
  definitionState = { tools: [] };
});

describe('PostInstallChecklist (shared fulfillment truth)', () => {
  it('renders done states when everything resolves', async () => {
    readyState();
    await shell();
    expect(screen.getByText(/All required slugs resolve READY/)).toBeTruthy();
    expect(screen.getByText(/live, enabled catalog rows/)).toBeTruthy();
    expect(screen.getByText(/No model is waiting on a credential/)).toBeTruthy();
  });

  it('renders skeletons while loading, never red X rows', async () => {
    documentsState = { isPending: true };
    catalogState = { isPending: true };
    modelsState = { isPending: true };
    definitionState = null;
    await shell();
    expect(screen.getByLabelText(/Checking fulfillment/)).toBeTruthy();
    expect(screen.queryByText(/Missing slugs/)).toBeNull();
  });

  it('renders retry, never gaps, on read errors', async () => {
    const refetch = vi.fn();
    documentsState = { isError: true, refetch };
    catalogState = { data: [] };
    modelsState = { data: [] };
    definitionState = { tools: [] };
    await shell();
    expect(screen.getByText(/unknown, not gaps/)).toBeTruthy();
    fireEvent.click(screen.getByText('Retry'));
    expect(refetch).toHaveBeenCalled();
  });

  it('names missing and unready slugs with fix paths', async () => {
    readyState();
    documentsState = { data: [{ sourceSlug: 'help-center', state: 'processing', latestVersion: 1 }] };
    await shell();
    expect(screen.getByText(/Not READY yet/)).toBeTruthy();
  });

  it('resolves duplicate slugs deterministically and says so', async () => {
    readyState();
    documentsState = {
      data: [
        { sourceSlug: 'help-center', state: 'processing', latestVersion: 1 },
        { sourceSlug: 'help-center', state: 'ready', latestVersion: 2 },
      ],
    };
    await shell();
    expect(screen.getByText(/All required slugs resolve READY/)).toBeTruthy();
    expect(screen.getByText(/match multiple documents/)).toBeTruthy();
  });

  it('distinguishes missing, disabled, changed, and unbound tool pins', async () => {
    readyState();
    catalogState = { data: [{ name: 'lookup_order', enabled: false, hash: 'h1' }] };
    await shell();
    expect(screen.getByText(/catalog row disabled/)).toBeTruthy();
  });

  it('flags hash drift only when both pins exist', async () => {
    readyState();
    catalogState = { data: [{ name: 'lookup_order', enabled: true, hash: 'h2' }] };
    await shell();
    expect(screen.getByText(/drifted since install/)).toBeTruthy();
  });

  it('makes credentials role-aware: connect for owners, notify for readers', async () => {
    readyState();
    modelsState = { data: [{ ref: 'a/good', usable: false, reasons: ['provider_credential_missing'] }] };
    await shell('owner');
    expect(screen.getByText(/Connect in Models/)).toBeTruthy();
    await shell('reader');
    expect(screen.getAllByText(/Ask an owner or admin/).length).toBeGreaterThan(0);
  });
});
