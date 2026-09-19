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
import { ChannelsView } from './ChannelsView';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const createMutate = vi.fn();

vi.mock('@hooks/studio/useSetupChannels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupChannels')>();
  return {
    ...actual,
    useChannels: () => ({ data: [], isPending: false, isError: false, refetch: vi.fn() }),
    useCreateChannel: () => ({ mutate: createMutate, isPending: false }),
    useUpdateChannel: () => ({ mutate: vi.fn(), isPending: false }),
    useDeactivateChannel: () => ({ mutate: vi.fn(), isPending: false }),
    useRotateChannelCredentials: () => ({ mutate: vi.fn(), isPending: false }),
    useVerifyChannel: () => ({ mutate: vi.fn(), isPending: false }),
    useWebhookSetup: () => ({ mutate: vi.fn(), isPending: false }),
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

async function shell(search: Record<string, string> = {}) {
  const rootRoute = createRootRoute();
  const channelsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/channels',
    validateSearch: (incoming: Record<string, unknown>) => ({
      returnTo: typeof incoming.returnTo === 'string' ? incoming.returnTo : undefined,
      assistantId: typeof incoming.assistantId === 'string' ? incoming.assistantId : undefined,
    }),
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <ChannelsView />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([channelsRoute]),
    history: createMemoryHistory({
      initialEntries: [
        `/agent-studio/channels${Object.keys(search).length > 0 ? `?${new URLSearchParams(search).toString()}` : ''}`,
      ],
    }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  createMutate.mockReset();
});

describe('ChannelsView (C14 returnTo exit)', () => {
  it('works standalone without search params', async () => {
    await shell();
    expect(screen.getByText('Channels')).toBeTruthy();
    expect(screen.queryByText(/Connected from publish/)).toBeNull();
  });

  it('announces the publish return and preselects the assistant', async () => {
    await shell({ returnTo: '/agent-studio/agents/agent-1', assistantId: 'agent-1' });
    expect(screen.getByText(/Connected from publish/)).toBeTruthy();
    fireEvent.click(screen.getByText('Connect'));
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const assistantSelect = selects.find((s) => s.value === 'agent-1');
    expect(assistantSelect?.value).toBe('agent-1');
  });

  it('binds the preselected assistant on connect', async () => {
    await shell({ returnTo: '/agent-studio/agents/agent-1', assistantId: 'agent-1' });
    fireEvent.click(screen.getByText('Connect'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Support WhatsApp'), { target: { value: 'Support Web' } });
    fireEvent.change(screen.getByPlaceholderText('https://acme.com, https://shop.acme.com'), {
      target: { value: 'https://acme.com' },
    });
    fireEvent.click(screen.getByText('Connect (starts pending)'));
    const sent = createMutate.mock.calls[0]?.[0] as { config: Record<string, unknown> };
    expect(sent.config.default_assistant_id).toBe('agent-1');
  });
});
