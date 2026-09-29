// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import toast from 'react-hot-toast';
import { ToolsView } from './ToolsView';

const upsertMutate = vi.fn();

vi.mock('react-hot-toast', () => {
  const fn = vi.fn() as never;
  const success = vi.fn() as never;
  const error = vi.fn() as never;
  return { default: Object.assign(fn, { success, error }) };
});

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

// NG-MT-1 — one tool carries a stored rate limit so the edit path can be
// exercised; one has none.
const CATALOG = [
  {
    id: 't1', name: 'lookup_ticket', version: 'v3', description: 'Ticket lookup', effectClass: 'READ_ONLY',
    approvalRequirement: 'NONE', hash: 'a'.repeat(64), enabled: true,
    executionEnvironment: 'external_gateway', allowedEgressDomains: [], bindingHost: null,
    inputSchema: { type: 'object' }, outputSchema: null, rateLimitPerRun: 5,
  },
  {
    id: 't2', name: 'plain_tool', version: 'v1', description: null, effectClass: 'READ_ONLY',
    approvalRequirement: 'NONE', hash: 'b'.repeat(64), enabled: true,
    executionEnvironment: 'external_gateway', allowedEgressDomains: [], bindingHost: null,
    inputSchema: { type: 'object' }, outputSchema: null, rateLimitPerRun: null,
  },
];

vi.mock('@hooks/studio/useSetupTools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTools')>();
  return {
    ...actual,
    useToolCatalog: () => ({ data: CATALOG, isPending: false, isFetching: false, isError: false }),
    useToolTemplates: () => ({ data: [], isPending: false, isFetching: false, isError: false }),
    useUpsertTool: () => ({ mutate: upsertMutate, isPending: false }),
    useToolFromTemplate: () => ({ mutate: vi.fn(), isPending: false }),
    useSetToolEnabled: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

function shell() {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ToolsView />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  upsertMutate.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe('ToolsView UpsertModal rate limit per run (NG-MT-1)', () => {
  it('exposes the field in the register modal and sends rateLimitPerRun on save', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText('New tool'));
    const rateInput = screen.getByPlaceholderText('unset = platform cap');
    expect(rateInput).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: 'fresh_tool' } });
    fireEvent.change(rateInput, { target: { value: '25' } });
    fireEvent.click(screen.getByText('Save tool'));
    expect(upsertMutate).toHaveBeenCalledTimes(1);
    expect(upsertMutate.mock.calls[0][0]).toMatchObject({ name: 'fresh_tool', rateLimitPerRun: 25 });
  });

  it('blocks save when the rate limit is below 1', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText('New tool'));
    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: 'fresh_tool' } });
    fireEvent.change(screen.getByPlaceholderText('unset = platform cap'), { target: { value: '0' } });
    expect(screen.getByText('Must be a number ≥ 1.')).toBeTruthy();
    expect(screen.getByText('Save tool').closest('button')?.disabled).toBe(true);
  });

  it('omits rateLimitPerRun when left blank on create', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText('New tool'));
    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: 'fresh_tool' } });
    fireEvent.click(screen.getByText('Save tool'));
    expect(upsertMutate).toHaveBeenCalledTimes(1);
    expect(upsertMutate.mock.calls[0][0]).not.toHaveProperty('rateLimitPerRun');
  });

  it('prefills the stored rate limit when editing', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByTitle('Edit lookup_ticket'));
    const rateInput = screen.getByPlaceholderText('unset = platform cap') as HTMLInputElement;
    expect(rateInput.value).toBe('5');
    expect(screen.getByText(/Currently 5\/run/)).toBeTruthy();
  });

  it('saves an edited rate limit', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByTitle('Edit lookup_ticket'));
    const rateInput = screen.getByPlaceholderText('unset = platform cap');
    fireEvent.change(rateInput, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Save tool'));
    expect(upsertMutate).toHaveBeenCalledTimes(1);
    expect(upsertMutate.mock.calls[0][0]).toMatchObject({ name: 'lookup_ticket', rateLimitPerRun: 10 });
  });
});
