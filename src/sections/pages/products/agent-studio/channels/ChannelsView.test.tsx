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
import { ChannelsView } from './ChannelsView';
import { ConnectSection } from './ConnectSection';
import { ChannelDetailSection } from './ChannelDetailSection';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

import { WebhookSetupSection } from './WebhookSetupSection';

const createMutate = vi.fn();
const updateMutate = vi.fn();
const webhookSetupMutate = vi.fn();
let mockChannelsData: unknown[] = [];
let mockChannelData: unknown = null;

vi.mock('@hooks/studio/useSetupChannels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupChannels')>();
  return {
    ...actual,
    useChannels: () => ({ data: mockChannelsData, isPending: false, isError: false, refetch: vi.fn() }),
    useChannel: () => ({ data: mockChannelData, isPending: false, isError: false, refetch: vi.fn() }),
    useCreateChannel: () => ({
      mutate: (input: unknown, opts?: { onSuccess?: (r: unknown) => void }) => {
        createMutate(input, opts);
        opts?.onSuccess?.({ id: 'ch-new-1' });
      },
      isPending: false,
    }),
    useUpdateChannel: () => ({ mutate: updateMutate, isPending: false }),
    useDeactivateChannel: () => ({ mutate: vi.fn(), isPending: false }),
    useRotateChannelCredentials: () => ({ mutate: vi.fn(), isPending: false }),
    useVerifyChannel: () => ({ mutate: vi.fn(), isPending: false }),
    useWebhookSetup: () => ({
      mutate: (accountId: unknown, opts?: { onSuccess?: (r: unknown) => void }) => {
        webhookSetupMutate(accountId, opts);
        opts?.onSuccess?.({ verifyToken: 'whsec_test_token', webhookUrl: 'https://console.example/wh/ch-web-1' });
      },
      isPending: false,
    }),
    widgetSnippet: () => '<script></script>',
    widgetSnippetOrigin: () => 'https://console.example',
    PLATFORM_CREDENTIAL_SPECS: [
      { platform: 'web', label: 'Website widget', blurb: 'Keyless.', fields: [] },
    ],
  };
});

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({
    data: [{ id: 'agent-1', name: 'Returns Helper', status: 'live' }],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function routerAt(initialPath: string) {
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/channels',
    validateSearch: (incoming: Record<string, unknown>) => ({
      returnTo: typeof incoming.returnTo === 'string' ? incoming.returnTo : undefined,
      assistantId: typeof incoming.assistantId === 'string' ? incoming.assistantId : undefined,
    }),
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<ChannelsView />),
  });
  const connectRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/connect',
    component: () => shell(<ConnectSection />),
  });
  const detailRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/$accountId',
    component: () => shell(<ChannelDetailSection />),
  });
  const webhookRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/$accountId/webhook-setup',
    component: () => shell(<WebhookSetupSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, connectRoute, detailRoute, webhookRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  createMutate.mockReset();
  updateMutate.mockReset();
  webhookSetupMutate.mockReset();
  mockChannelsData = [];
  mockChannelData = null;
  sessionStorage.clear();
});

describe('ChannelsView (C14 returnTo exit)', () => {
  it('works standalone without search params', async () => {
    await routerAt('/agent-studio/channels');
    expect(screen.getByText('Channels')).toBeTruthy();
    expect(screen.queryByText(/Connected from publish/)).toBeNull();
  });

  it('announces the publish return and links to connect with the contract params', async () => {
    const router = await routerAt('/agent-studio/channels?returnTo=/agent-studio/agents/agent-1&assistantId=agent-1');
    expect(screen.getByText(/Connected from publish/)).toBeTruthy();
    fireEvent.click(screen.getByText('Connect'));
    // Lands on the dedicated connect section, contract params intact.
    expect(router.state.location.pathname).toBe('/agent-studio/channels/connect');
    expect(router.state.location.search).toMatchObject({
      returnTo: '/agent-studio/agents/agent-1',
      assistantId: 'agent-1',
    });
  });
});

describe('ConnectSection (C-1)', () => {
  it('preselects the assistant from the C14 contract', async () => {
    await routerAt('/agent-studio/channels/connect?returnTo=/agent-studio/agents/agent-1&assistantId=agent-1');
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const assistantSelect = selects.find((s) => s.value === 'agent-1');
    expect(assistantSelect?.value).toBe('agent-1');
    expect(screen.getByText(/After connecting you return to the agent/)).toBeTruthy();
  });

  it('binds the preselected assistant on connect and returns to the agent', async () => {
    const router = await routerAt('/agent-studio/channels/connect?returnTo=/agent-studio/agents/agent-1&assistantId=agent-1');
    fireEvent.change(screen.getByPlaceholderText('e.g. Support WhatsApp'), { target: { value: 'Support Web' } });
    fireEvent.change(screen.getByPlaceholderText('https://acme.com, https://shop.acme.com'), {
      target: { value: 'https://acme.com' },
    });
    fireEvent.click(screen.getByText('Connect (starts pending)'));
    const sent = createMutate.mock.calls[0]?.[0] as { config: Record<string, unknown> };
    expect(sent.config.default_assistant_id).toBe('agent-1');
    // C14: connect-then-return never dead-ends.
    expect(router.state.location.pathname).toBe('/agent-studio/agents/agent-1');
  });

  it('blocks submit while validation problems remain (byte-identical rules)', async () => {
    await routerAt('/agent-studio/channels/connect');
    // No display name, no assistant, no origins → Connect stays disabled.
    expect(screen.getByText('Connect (starts pending)')).toBeDisabled();
    expect(createMutate).not.toHaveBeenCalled();
  });
});

describe('ChannelDetailSection (C-2, H12 widget extras)', () => {
  const webAccount = {
    id: 'ch-web-1',
    platform: 'web',
    displayName: 'Web Widget',
    publicKey: 'nk_live_test',
    status: 'active',
    health: null,
    config: { quick_replies: ['Book a demo'], csat_enabled: false },
    webhookUrl: null,
    createdAt: null,
    updatedAt: null,
  };

  it('renders the web-only quick replies + CSAT fields and PATCHes the exact engine-consumed keys', async () => {
    mockChannelData = webAccount;
    await routerAt('/agent-studio/channels/ch-web-1');
    // The section exposes the engine-consumed config keys, pre-filled.
    const replies = screen.getByLabelText('Quick replies (one per line)') as HTMLTextAreaElement;
    expect(replies.value).toBe('Book a demo');
    const csat = screen.getByLabelText(/CSAT feedback/) as HTMLInputElement;
    expect(csat.checked).toBe(false);
    // Editing wires through the existing PATCH path with exactly the keys
    // the engine's widgetSessionBootstrap + feedback gate read.
    fireEvent.change(replies, { target: { value: 'Book a demo\nSee pricing' } });
    fireEvent.click(csat);
    fireEvent.click(screen.getAllByRole('button', { name: 'Save changes' })[0]);
    const sent = updateMutate.mock.calls[0]?.[0] as { channelId: string; config: Record<string, unknown> };
    expect(sent.channelId).toBe('ch-web-1');
    // Exactly the keys the engine's widgetSessionBootstrap + feedback gate
    // read (allowed_domains/greeting also ride along from the pre-existing
    // web block — asserted separately from this gap's keys).
    expect(sent.config.quick_replies).toEqual(['Book a demo', 'See pricing']);
    expect(sent.config.csat_enabled).toBe(true);
  });

  it('hides the widget extras on non-web platforms', async () => {
    mockChannelData = { ...webAccount, id: 'ch-wa-1', platform: 'whatsapp', displayName: 'WA Line', publicKey: null, config: {} };
    await routerAt('/agent-studio/channels/ch-wa-1');
    expect(screen.queryByLabelText('Quick replies (one per line)')).toBeNull();
    expect(screen.queryByLabelText(/CSAT feedback/)).toBeNull();
    // whatsapp-only fields are present instead.
    expect(screen.getByText('Template name')).toBeTruthy();
    expect(screen.getByText(/Voice replies/)).toBeTruthy();
  });

  it('redirects an unknown account id back to the list', async () => {
    mockChannelData = null;
    const router = await routerAt('/agent-studio/channels/nope');
    expect(router.state.location.pathname).toBe('/agent-studio/channels');
  });
});

describe('WebhookSetupSection (C-3 shown-once)', () => {
  const webAccount = {
    id: 'ch-web-1',
    platform: 'web',
    displayName: 'Web Widget',
    publicKey: 'nk_live_test',
    status: 'active',
    health: null,
    config: {},
    webhookUrl: null,
    createdAt: null,
    updatedAt: null,
  };

  it('writes the reveal marker when the verify token is issued', async () => {
    mockChannelData = webAccount;
    await routerAt('/agent-studio/channels/ch-web-1/webhook-setup');
    fireEvent.click(screen.getByText('Run webhook setup'));
    expect(webhookSetupMutate).toHaveBeenCalledWith('ch-web-1', expect.anything());
    expect(sessionStorage.getItem('channels:webhook-setup:revealed:ch-web-1')).toBe('1');
    expect(screen.getByText('whsec_test_token')).toBeTruthy();
  });

  it('shows the already-revealed state on refresh instead of the token', async () => {
    mockChannelData = webAccount;
    sessionStorage.setItem('channels:webhook-setup:revealed:ch-web-1', '1');
    await routerAt('/agent-studio/channels/ch-web-1/webhook-setup');
    expect(screen.getByText(/never rendered twice/)).toBeTruthy();
    expect(screen.queryByText('whsec_test_token')).toBeNull();
    expect(screen.queryByText('Run webhook setup')).toBeNull();
  });

  it('done() returns to the guarded returnTo when the publish contract is present', async () => {
    mockChannelData = webAccount;
    const router = await routerAt(
      '/agent-studio/channels/ch-web-1/webhook-setup?returnTo=/agent-studio/agents/agent-1&assistantId=agent-1',
    );
    fireEvent.click(screen.getByText('Run webhook setup'));
    fireEvent.click(screen.getByText('Done'));
    expect(router.state.location.pathname).toBe('/agent-studio/agents/agent-1');
  });

  it('done() falls back to channel detail without a returnTo', async () => {
    mockChannelData = webAccount;
    const router = await routerAt('/agent-studio/channels/ch-web-1/webhook-setup');
    fireEvent.click(screen.getByText('Run webhook setup'));
    fireEvent.click(screen.getByText('Done'));
    expect(router.state.location.pathname).toBe('/agent-studio/channels/ch-web-1');
  });
});
