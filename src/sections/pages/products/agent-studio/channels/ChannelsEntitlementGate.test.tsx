// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { ChannelsEntitlementGate } from './ChannelsEntitlementGate';

let mockRole: string = 'owner';
let mockProductState = 'unknown';
let mockProductStatus: string | null = null;
const activateMutate = vi.fn();

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

vi.mock('@hooks/studio/useSetupChannels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupChannels')>();
  return {
    ...actual,
    useChannelsProduct: () => ({
      state: mockProductState,
      status: mockProductStatus,
      isPending: false,
    }),
    useActivateChannelsProduct: () => ({ mutate: activateMutate, isPending: false }),
  };
});

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

beforeEach(() => {
  mockRole = 'owner';
  mockProductState = 'unknown';
  mockProductStatus = null;
  activateMutate.mockClear();
});

describe('ChannelsEntitlementGate', () => {
  it('renders nothing when enabled', () => {
    mockProductState = 'enabled';
    mockProductStatus = 'active';
    const { container } = render(shell(<ChannelsEntitlementGate />));
    expect(container.textContent).toBe('');
  });

  it('renders nothing while unknown (backend remains the enforcer)', () => {
    mockProductState = 'unknown';
    render(shell(<ChannelsEntitlementGate />));
    expect(screen.queryByText(/isn't enabled/)).toBeNull();
  });

  it('owner sees the enable panel with a working button when missing', () => {
    mockProductState = 'missing';
    render(shell(<ChannelsEntitlementGate />));
    expect(screen.getByText(/isn't enabled for this workspace/)).toBeTruthy();
    const btn = screen.getByRole('button', { name: /Enable Channels/ });
    fireEvent.click(btn);
    expect(activateMutate).toHaveBeenCalledTimes(1);
  });

  it('non-privileged role sees ask-an-owner note and no button', () => {
    mockRole = 'reader';
    mockProductState = 'missing';
    render(shell(<ChannelsEntitlementGate />));
    expect(screen.getByText(/Ask an owner or billing contact/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Enable Channels/ })).toBeNull();
  });

  it('expired reads as missing (re-enable offered)', () => {
    mockProductState = 'missing';
    mockProductStatus = 'expired';
    render(shell(<ChannelsEntitlementGate />));
    expect(screen.getByText(/lapsed/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Enable Channels/ })).toBeTruthy();
  });

  it('past_due shows the billing note, never an enable button', () => {
    mockProductState = 'blocked';
    mockProductStatus = 'past_due';
    render(shell(<ChannelsEntitlementGate />));
    expect(screen.getByText(/past due/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Enable Channels/ })).toBeNull();
    expect(activateMutate).not.toHaveBeenCalled();
  });
});
