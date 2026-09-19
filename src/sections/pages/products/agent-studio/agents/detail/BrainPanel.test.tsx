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
import { BrainPanel } from './BrainPanel';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const DEFINITION = {
  ...defaultConsumer(),
  instructions: '## Role\nR.\n',
  model_policy: { allowed_models: ['a/good', 'b/bad'], fallback_enabled: true },
  model_params: { temperature: 0.7, top_p: 1, max_output_tokens: 16000, reasoning_effort: 'high' },
};

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistant: () => ({ data: { id: 'agent-1', activeVersionId: 'v3' }, isPending: false }),
    useAssistantDefinition: () => ({
      data: { definition: DEFINITION, versionId: 'v3', hash: 'h3', status: 'PUBLISHED', isDraft: false },
      isPending: false,
      isFetching: false,
      isError: false,
    }),
    useAssistantVersions: () => ({ data: [{ id: 'v3', version: 3 }], isPending: false }),
  };
});

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  const catalog = [
    { provider: 'a', modelId: 'good', ref: 'a/good', displayName: 'A Good', contextWindowTokens: null, maxOutputTokens: null, capabilities: {}, residency: null, usable: true, reasons: [] },
    { provider: 'b', modelId: 'bad', ref: 'b/bad', displayName: 'B Bad', contextWindowTokens: null, maxOutputTokens: null, capabilities: {}, residency: null, usable: false, reasons: ['residency_incompatible'] },
  ];
  return {
    ...actual,
    useModelAvailability: () => ({ data: catalog, isPending: false, isFetching: false, isError: false }),
    useModelCosts: () => ({
      data: [{ provider: 'a', model: 'good', ref: 'a/good', costMicrosPer1kInput: 3000, costMicrosPer1kOutput: 15000, costMicrosPer1kCachedInput: null, currency: 'USD', effectiveFrom: null }],
      isPending: false,
      isFetching: false,
      isError: false,
    }),
  };
});

vi.mock('@hooks/studio/useSetupProviders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupProviders')>();
  return {
    ...actual,
    useProviderCredentials: () => ({
      data: [
        { id: 'k1', provider: 'a', label: 'prod', externalRef: null, source: 'byok', status: 'active', secretFingerprint: '****9f2c', revocationReason: null, compromised: false, createdAt: '2026-08-01T00:00:00Z', rotatedAt: null, revokedAt: null },
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
          <BrainPanel agentId="agent-1" />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe('BrainPanel dedicated section', () => {
  it('renders the ordered serving chain with excluded reasons and costs', async () => {
    await act(async () => {
      await shell();
    });
    expect(screen.getByText('Brain — model policy')).toBeTruthy();
    expect(screen.getByText('a/good')).toBeTruthy();
    expect(screen.getByText('b/bad')).toBeTruthy();
    expect(screen.getByText(/residency incompatible/)).toBeTruthy();
    expect(screen.getByText(/\$0\.0030\/1k in/)).toBeTruthy();
    expect(screen.getByText(/Fallback is armed/)).toBeTruthy();
  });

  it('reads params with the matched preset named', async () => {
    await act(async () => {
      await shell();
    });
    expect(screen.getByText('0.7')).toBeTruthy();
    expect(screen.getByText('16,000')).toBeTruthy();
    expect(screen.getByText('high')).toBeTruthy();
    expect(screen.getByText('Scholar')).toBeTruthy();
  });

  it('shows credential status with fingerprints and deep-links out (never edits)', async () => {
    await act(async () => {
      await shell();
    });
    expect(screen.getByText(/\*\*\*\*9f2c/)).toBeTruthy();
    expect(screen.getByText(/Edit in builder/).closest('a')?.getAttribute('href')).toBe('/agent-studio/agents/agent-1/build');
    expect(screen.getByText(/Manage in Models/).closest('a')?.getAttribute('href')).toBe('/agent-studio/models');
    // No inputs anywhere on this panel — read-only by contract.
    expect(document.querySelector('input, textarea, select, button')).toBeNull();
  });
});
