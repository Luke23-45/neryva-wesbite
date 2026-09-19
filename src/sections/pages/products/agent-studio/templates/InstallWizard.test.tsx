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
import { ApiError } from '@lib/engine/client';
import { InstallWizard } from './InstallWizard';
import type { TemplateListEntry } from '@hooks/studio/useSetupTemplates';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const createMutate = vi.fn();
let createError: unknown = null;
let createPending = false;

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useCreateAssistant: () => ({ mutate: createMutate, isPending: createPending, error: createError }),
    useAssistantDefinition: () => ({ data: undefined }),
  };
});

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return {
    ...actual,
    useControlBlocks: () => ({ data: [] }),
  };
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

function entry(overrides?: Partial<TemplateListEntry>): TemplateListEntry {
  return {
    template: {
      slug: 'support-concierge',
      version: '3.0.0',
      status: 'stable',
      family: 'support',
      definition: {},
      bindings: { tools: { required: [] }, knowledge: { required: [] }, channels: { channels: [] } },
      evalRef: null,
      releasePolicy: null,
      hash: null,
      minEngineSchema: 2,
    },
    available: true,
    compatible: true,
    reasons: [],
    installed: false,
    updateAvailable: 'none',
    ...overrides,
  };
}

async function shell(props?: Partial<React.ComponentProps<typeof InstallWizard>>) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <InstallWizard entry={entry()} onClose={() => undefined} canInstall installDenied="denied" {...props} />
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
  createError = null;
  createPending = false;
});

describe('InstallWizard (single install path — fixes, never codes)', () => {
  it('installs without a description field (engine-discarded, immutable after)', async () => {
    await shell();
    expect(screen.queryByLabelText(/Description/)).toBeNull();
    expect(screen.getByText(/cannot be edited later/)).toBeTruthy();
    fireEvent.click(screen.getByText('Install as draft'));
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'support-concierge', template: { slug: 'support-concierge', version: '3.0.0' } }),
      expect.anything(),
    );
    const sent = createMutate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect('description' in sent).toBe(false);
  });

  it('routes 409 collisions to rename with the overlay staying', async () => {
    createError = new ApiError(409, 'conflict', 'assistant name already taken — pick another name');
    await shell();
    expect(screen.getByText(/Name taken/)).toBeTruthy();
    expect(screen.getByText(/nothing was created/)).toBeTruthy();
  });

  it('renders 403 platform holds as not-retryable', async () => {
    createError = new ApiError(403, 'forbidden', 'template slug@version is blocked');
    await shell();
    expect(screen.getByText(/platform hold/)).toBeTruthy();
    expect(screen.getByText(/cannot be retried by you/)).toBeTruthy();
  });

  it('names unresolvable tools with the two paths', async () => {
    createError = new ApiError(400, 'validation_failed', 'Request validation failed', { tool: 'pdf-extract' });
    await shell();
    expect(screen.getByText(/pdf-extract/)).toBeTruthy();
    expect(screen.getByText(/ask an admin/i)).toBeTruthy();
  });

  it('confirms re-installs by naming the duplication', async () => {
    await shell({ entry: entry({ installed: true }) });
    expect(screen.getByText(/creates ANOTHER assistant/)).toBeTruthy();
    expect(screen.getByTitle(/Confirm the duplication/)).toBeDisabled();
    fireEvent.click(screen.getByText(/Install anyway/));
    expect(screen.getByTitle(/Copy into a draft/)).toBeEnabled();
  });
});
