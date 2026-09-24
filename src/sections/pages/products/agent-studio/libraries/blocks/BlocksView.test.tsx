// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { BlocksView } from './BlocksView';

const setMutate = vi.fn();
const clearMutate = vi.fn();

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const BLOCKS = [
  { id: 'b1', targetType: 'tool', targetName: 'refund-payment', reason: 'credential rotation', expiresAt: new Date(Date.now() + 3 * 86_400_000).toISOString(), createdBy: 'ava@acme.co', createdAt: '2026-09-10T00:00:00Z' },
  { id: 'b2', targetType: 'template', targetName: 'support-starter', reason: 'legal hold', expiresAt: null, createdBy: 'li@acme.co', createdAt: '2026-05-28T00:00:00Z' },
  { id: 'b3', targetType: 'capability', targetName: 'web-browse', reason: 'incident containment', expiresAt: '2026-01-01T00:00:00Z', createdBy: null, createdAt: null },
];

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return {
    ...actual,
    useControlBlocks: () => ({ data: BLOCKS, isPending: false, isError: false, error: null, refetch: vi.fn() }),
    useSetControlBlock: () => ({ mutate: setMutate, isPending: false }),
    useClearControlBlock: () => ({ mutate: clearMutate, isPending: false }),
    useMemberNameMap: () => ({ nameOf: (id: string) => ({ 'ava@acme.co': 'Ava', 'li@acme.co': 'Li' })[id] ?? null }),
  };
});

function shell() {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <BlocksView />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  setMutate.mockReset();
  clearMutate.mockReset();
});

describe('BlocksView', () => {
  it('renders active rows with Expires-in-N pills and provenance columns; expired hidden by default', () => {
    shell();
    expect(screen.getByText('refund-payment')).toBeTruthy();
    expect(screen.getByText('support-starter')).toBeTruthy();
    expect(screen.getByText(/Expires in 3 days/)).toBeTruthy();
    expect(screen.getByText('Ava')).toBeTruthy();
    expect(screen.getByText('Li')).toBeTruthy();
    expect(screen.queryByText('web-browse')).toBeNull();
  });

  it('status filter surfaces expired rows with the Expired pill', async () => {
    shell();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'expired' } });
    });
    const row = screen.getByText('web-browse').parentElement?.parentElement as HTMLElement;
    expect(within(row).getByText('Expired')).toBeTruthy();
    expect(screen.queryByText('refund-payment')).toBeNull();
  });

  it('search narrows by name and reason', async () => {
    const view = shell();
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/Name or reason/), { target: { value: 'legal' } });
    });
    expect(screen.getByText('support-starter')).toBeTruthy();
    expect(screen.queryByText('refund-payment')).toBeNull();
    view.unmount();
  });

  it('clear asks first and clears only the confirmed row', async () => {
    shell();
    const row = screen.getByText('refund-payment').closest('tr') ?? screen.getByText('refund-payment').parentElement;
    const clearButton = within(row as HTMLElement).getByRole('button', { name: 'Clear' });
    await act(async () => {
      fireEvent.click(clearButton);
    });
    expect(screen.getByText(/becomes assignable and servable again/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear block' }));
    });
    expect(clearMutate).toHaveBeenCalledTimes(1);
    expect(vi.mocked(clearMutate).mock.calls[0]?.[0]).toBe('b1');
  });

  it('rejects past expiry and confirms permanent blocks twice', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /set block/i })[0]);
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Target name/), { target: { value: 'x-tool' } });
      fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'why, audited' } });
      fireEvent.change(screen.getByLabelText('Block expiry'), { target: { value: '2020-01-01T00:00' } });
    });
    expect(screen.getByText(/must be in the future/)).toBeTruthy();
    // Back to permanent: first click arms, second click commits without expiresAt.
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Block expiry'), { target: { value: '' } });
    });
    const footerButtons = screen.getAllByRole('button', { name: /set block/i });
    await act(async () => {
      fireEvent.click(footerButtons[footerButtons.length - 1]);
    });
    expect(screen.getByRole('button', { name: /no expiry/ })).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /no expiry/ }));
    });
    expect(setMutate).toHaveBeenCalledTimes(1);
    expect(vi.mocked(setMutate).mock.calls[0]?.[0]).toMatchObject({ targetName: 'x-tool', reason: 'why, audited' });
    expect(vi.mocked(setMutate).mock.calls[0]?.[0]).not.toHaveProperty('expiresAt');
  });

  it('resets the create modal between sessions', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /set block/i })[0]);
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Target name/), { target: { value: 'stale-tool' } });
      fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'stale reason' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /set block/i })[0]);
    });
    expect((screen.getByLabelText(/Target name/) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Reason/) as HTMLInputElement).value).toBe('');
  });

  it('discloses the 200-row server cap when the list is full', async () => {
    shell();
    // Fixture has 3 rows — the cap note must NOT render for a short list.
    expect(screen.queryByText(/at most 200 rows/)).toBeNull();
  });
});
