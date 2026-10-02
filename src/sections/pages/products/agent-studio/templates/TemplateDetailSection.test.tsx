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
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { TemplateDetailSection } from './TemplateDetailSection';
import type { TemplateListEntry } from '@hooks/studio/useSetupTemplates';

let mockRole: string = 'owner';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

let templatesData: TemplateListEntry[] = [];

vi.mock('@hooks/studio/useSetupTemplates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTemplates')>();
  return {
    ...actual,
    useAssistantTemplates: () => ({ data: templatesData, isPending: false, isError: false }),
  };
});

vi.mock('@hooks/studio/useSetupChannels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupChannels')>();
  return {
    ...actual,
    useChannels: () => ({ data: [], isPending: false, isError: false, refetch: vi.fn() }),
  };
});

function entry(overrides?: Partial<TemplateListEntry>): TemplateListEntry {
  return {
    template: {
      slug: 'support-concierge',
      version: '3.0.0',
      status: 'stable',
      family: 'support',
      definition: { model_policy: { allowed_models: ['a/good'] } },
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

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function routerAt(initialPath: string, role = 'owner') {
  mockRole = role;
  const rootRoute = createRootRoute();
  const templatesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/templates',
    component: () => <Outlet />,
  });
  const galleryRoute = createRoute({
    getParentRoute: () => templatesRoute,
    path: '/',
    component: () => shell(<div>gallery</div>),
  });
  const detailRoute = createRoute({
    getParentRoute: () => templatesRoute,
    path: '/$templateId',
    component: () => shell(<TemplateDetailSection />),
  });
  const installProbe = createRoute({
    getParentRoute: () => templatesRoute,
    path: '/$templateId/install',
    component: () => shell(<div>install section</div>),
  });
  const originProbe = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/agents/new',
    component: () => shell(<div>builder origin</div>),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      templatesRoute.addChildren([galleryRoute, detailRoute, installProbe]),
      originProbe,
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  templatesData = [entry()];
  sessionStorage.clear();
  localStorage.clear();
});

const DETAIL = '/agent-studio/templates/support-concierge';

describe('TemplateDetailSection content', () => {
  it('renders the identifier title and family/status subtitle', async () => {
    await routerAt(DETAIL);
    expect(screen.getByText('support-concierge@3.0.0')).toBeTruthy();
    expect(screen.getByText(/support · stable · sha/)).toBeTruthy();
  });

  it('shows the incompatibility advisory with reason codes and fix links', async () => {
    templatesData = [
      entry({
        compatible: false,
        reasons: [{ code: 'required_tool_missing', detail: 'lookup_order is not pinned' }],
      }),
    ];
    await routerAt(DETAIL);
    expect(screen.getByText('Compatibility')).toBeTruthy();
    expect(screen.getByText('Missing tool')).toBeTruthy();
    expect(screen.getByText('lookup_order is not pinned')).toBeTruthy();
    const fix = screen.getByText(/Open tool catalog/);
    expect(fix.closest('a')).toHaveProperty('href', expect.stringContaining('/agent-studio/tools'));
  });

  it('switches through the six tabs with untruncated content', async () => {
    await routerAt(DETAIL);
    fireEvent.click(screen.getByText('Tools (1)', { selector: 'button' }));
    expect(screen.getByText(/Find orders first/)).toBeTruthy();
    fireEvent.click(screen.getByText('Evaluation', { selector: 'button' }));
    expect(screen.getByText('case 0')).toBeTruthy();
    expect(screen.queryByText('case 6')).toBeNull();
    fireEvent.click(screen.getByText('Show all'));
    expect(screen.getByText('case 6')).toBeTruthy();
    fireEvent.click(screen.getByText('Release', { selector: 'button' }));
    expect(screen.getByText(/Regression no worse than 0\.02/)).toBeTruthy();
    fireEvent.click(screen.getByText('Definition', { selector: 'button' }));
    expect(screen.getByText(/Definition \(engine payload\)/)).toBeTruthy();
  });

  it('disables Install for non-authors with the denied copy', async () => {
    await routerAt(DETAIL, 'reader');
    const install = screen.getByText('Install').closest('button')!;
    expect(install).toBeDisabled();
    expect(install.title).toMatch(/requires an owner|author|permission|denied/i);
  });
});

describe('TemplateDetailSection navigation', () => {
  it('Install routes to the install section for the gallery context', async () => {
    const router = await routerAt(DETAIL);
    fireEvent.click(screen.getByText('Install'));
    expect(router.state.location.pathname).toBe(`${DETAIL}/install`);
    expect(router.state.location.search).toEqual({});
  });

  it('threads the builder-origin context through Install (autoLand preserved)', async () => {
    const router = await routerAt(`${DETAIL}?returnTo=/agent-studio/agents/new&autoLand=builder`);
    fireEvent.click(screen.getByText('Install'));
    expect(router.state.location.pathname).toBe(`${DETAIL}/install`);
    expect(router.state.location.search).toMatchObject({
      returnTo: '/agent-studio/agents/new',
      autoLand: 'builder',
    });
  });

  it('‹ back row returns to the threaded origin', async () => {
    await routerAt(`${DETAIL}?returnTo=/agent-studio/agents/new&autoLand=builder`);
    expect(screen.getByRole('link', { name: 'Back' })).toHaveProperty(
      'href',
      expect.stringContaining('/agent-studio/agents/new'),
    );
  });

  it('ignores a non-agent-studio ?returnTo and falls back to the gallery', async () => {
    const router = await routerAt(`${DETAIL}?returnTo=https://evil.example/x`);
    expect(screen.getByRole('link', { name: 'Templates' })).toHaveProperty(
      'href',
      expect.stringContaining('/agent-studio/templates'),
    );
    fireEvent.click(screen.getByText('Back to gallery'));
    expect(router.state.location.pathname).toBe('/agent-studio/templates');
  });

  it('bounces an unknown template id to the gallery', async () => {
    const router = await routerAt('/agent-studio/templates/no-such-template');
    expect(router.state.location.pathname).toBe('/agent-studio/templates');
  });
});
