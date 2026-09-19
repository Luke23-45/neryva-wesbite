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
import { TemplateGallery } from './TemplateGallery';
import type { TemplateListEntry } from '@hooks/studio/useSetupTemplates';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

function entry(overrides?: Partial<TemplateListEntry>): TemplateListEntry {
  return {
    template: {
      slug: 'support-concierge',
      version: '3.0.0',
      status: 'stable',
      family: 'support',
      definition: { model_policy: { allowed_models: ['a/good', 'a/better'] } },
      bindings: {
        tools: { required: [{ name: 'lookup_order', when_to_use: 'Find orders first.' }] },
        knowledge: { required: ['help-center'] },
        channels: { channels: [] },
      },
      evalRef: {
        evaluators: { evaluators: [{ name: 'policy-judge', version: '1.0.0', kind: 'llm-judge', checks: ['tone'] }] },
        cases: Array.from({ length: 7 }, (_, i) => ({ input: `case ${i}` })),
      },
      releasePolicy: { release_policy_version: 3, required: ['safety_pass', { regression_no_worse_than: 0.02 }] },
      hash: 'h'.repeat(64),
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

let entriesData: TemplateListEntry[] = [];

vi.mock('@hooks/studio/useSetupTemplates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTemplates')>();
  return {
    ...actual,
    useAssistantTemplates: () => ({ data: entriesData, isPending: false, isError: false }),
  };
});

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return {
    ...actual,
    useControlBlocks: () => ({ data: [] }),
  };
});

vi.mock('@hooks/studio/useSetupChannels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupChannels')>();
  return {
    ...actual,
    useChannels: () => ({ data: [], isPending: false, isError: false, refetch: vi.fn() }),
  };
});

async function shell(onInstall: (entry: TemplateListEntry) => void = () => undefined) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <TemplateGallery onInstall={onInstall} />
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
  entriesData = [entry()];
});

describe('TemplateGallery (shared origin truth)', () => {
  it('shows BOM counts from the entry, never a grid', async () => {
    await shell();
    expect(screen.getByText(/1 tools · 1 knowledge · 2 models · seeded evals/)).toBeTruthy();
  });

  it('searches tools, knowledge, and evaluators — not just slug and family', async () => {
    entriesData = [entry(), entry({ template: { ...entry().template, slug: 'billing-auditor', family: 'ops', definition: {}, bindings: { tools: { required: [] }, knowledge: { required: [] }, channels: { channels: [] } }, evalRef: null } })];
    await shell();
    fireEvent.change(screen.getByLabelText(/Search templates/), { target: { value: 'lookup_order' } });
    expect(screen.getByText(/support-concierge/)).toBeTruthy();
    expect(screen.queryByText(/billing-auditor/)).toBeNull();
    fireEvent.change(screen.getByLabelText(/Search templates/), { target: { value: 'policy-judge' } });
    expect(screen.getByText(/support-concierge/)).toBeTruthy();
  });

  it('routes installs through the wizard (which confirms duplication)', async () => {
    const onInstall = vi.fn();
    entriesData = [entry({ installed: true })];
    await shell(onInstall);
    fireEvent.click(screen.getByText('Install'));
    expect(onInstall).toHaveBeenCalledTimes(1);
  });

  it('disables schema-too-new cards before click, never post-click', async () => {
    entriesData = [entry({ template: { ...entry().template, minEngineSchema: 3 } })];
    await shell();
    expect(screen.getByTitle(/Needs console schema 3/)).toBeDisabled();
  });

  it('shows update adoption as re-install-as-new', async () => {
    entriesData = [entry({ installed: true, updateAvailable: 'major' })];
    await shell();
    expect(screen.getByText(/major update — Install v3\.0\.0 as new/)).toBeTruthy();
  });

  it('opens detail with untruncated eval cases and object-safe release rows', async () => {
    await shell();
    fireEvent.click(screen.getByText('Details'));
    fireEvent.click(screen.getByText('Tools (1)', { selector: 'button' }));
    expect(screen.getByText(/Find orders first/)).toBeTruthy();
    fireEvent.click(screen.getByText('Evaluation', { selector: 'button' }));
    expect(screen.getByText('case 0')).toBeTruthy();
    expect(screen.queryByText('case 6')).toBeNull();
    fireEvent.click(screen.getByText('Show all'));
    expect(screen.getByText('case 6')).toBeTruthy();
    fireEvent.click(screen.getByText('Release', { selector: 'button' }));
    expect(screen.getByText(/regression_no_worse_than/)).toBeTruthy();
  });
});
