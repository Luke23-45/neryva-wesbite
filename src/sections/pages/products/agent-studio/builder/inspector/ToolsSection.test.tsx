// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import toast from 'react-hot-toast';
import { ToolsSection } from './ToolsSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const saveMutate = vi.fn();
const updateMutate = vi.fn();
const catalogRefetch = vi.fn();

vi.mock('react-hot-toast', () => {
  const fn = vi.fn() as never;
  const success = vi.fn() as never;
  const error = vi.fn() as never;
  return { default: Object.assign(fn, { success, error }) };
});

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useSaveDraftVersion: () => ({ mutate: saveMutate, isPending: false }),
    useUpdateDraftVersion: () => ({ mutate: updateMutate, isPending: false }),
    useAssistantDefinition: () => ({
      data: {
        definition: { ...defaultConsumer(), instructions: '## Role\nR.\n' },
        versionId: 'v9',
        hash: 'h2',
        status: 'DRAFT',
        isDraft: true,
      },
      isPending: false,
      isFetching: false,
      isError: false,
    }),
  };
});

const CATALOG = [
  {
    id: 't1', name: 'lookup_ticket', version: 'v3', description: 'Ticket lookup', effectClass: 'READ_ONLY',
    approvalRequirement: 'NONE', hash: 'a'.repeat(64), enabled: true,
    executionEnvironment: 'sandboxed_microvm', allowedEgressDomains: ['api.crm.example'], bindingHost: 'api.crm.example',
  },
  {
    id: 't2', name: 'refund_payment', version: 'v2', description: null, effectClass: 'DESTRUCTIVE',
    approvalRequirement: 'REQUIRED', hash: 'b'.repeat(64), enabled: true,
    executionEnvironment: 'external_gateway', allowedEgressDomains: ['pay.example'], bindingHost: 'pay.example',
  },
  {
    id: 't3', name: 'old_tool', version: 'v1', description: null, effectClass: 'MUTATING',
    approvalRequirement: 'NONE', hash: 'd'.repeat(64), enabled: false,
    executionEnvironment: null, allowedEgressDomains: null, bindingHost: null,
  },
  {
    id: 't4', name: 'export_report', version: 'v1', description: null, effectClass: 'MUTATING',
    approvalRequirement: 'NONE', hash: 'e'.repeat(64), enabled: true,
    executionEnvironment: null, allowedEgressDomains: null, bindingHost: null,
  },
  {
    id: 't5', name: 'sync_crm', version: 'v7', description: null, effectClass: 'MUTATING',
    approvalRequirement: 'NONE', hash: 'f'.repeat(64), enabled: true,
    executionEnvironment: 'external_gateway', allowedEgressDomains: ['crm.example'], bindingHost: 'crm.example',
  },
];

vi.mock('@hooks/studio/useSetupTools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTools')>();
  return {
    ...actual,
    useToolCatalog: () => ({
      data: CATALOG,
      isPending: false,
      isError: false,
      dataUpdatedAt: 1_700_000_000_000,
      refetch: catalogRefetch,
    }),
    useToolTemplates: () => ({ data: [], isPending: false, isError: false }),
  };
});

function definitionWith(tools: AgentDefinition['tools'], extra?: Partial<AgentDefinition>): AgentDefinition {
  const def = defaultConsumer();
  return { ...def, instructions: '## Role\nR.\n', tools, ...extra };
}

const BOUND: AgentDefinition['tools'] = [
  {
    name: 'lookup_ticket', access: 'read', approval: 'never', schema_hash: 'a'.repeat(64), execution_mode: 'live',
    enabled: true, expose_description_to_planner: true, log_call_payloads: true,
  },
  {
    name: 'refund_payment', access: 'write', approval: 'on_effect', schema_hash: 'b'.repeat(64), execution_mode: 'shadow',
    enabled: true, expose_description_to_planner: true, log_call_payloads: false,
  },
  {
    name: 'sync_crm', access: 'read', approval: 'never', schema_hash: 'c'.repeat(64), execution_mode: 'live',
    enabled: true, expose_description_to_planner: true, log_call_payloads: true,
  },
];

function shell(props?: Partial<React.ComponentProps<typeof ToolsSection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ToolsSection
          assistantId="agent-main"
          definition={definitionWith(BOUND)}
          versionId="v1"
          versionHash="h1"
          isDraft
          canAuthor
          onDirtyChange={() => undefined}
          saveSignal={0}
          {...props}
        />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  saveMutate.mockReset();
  updateMutate.mockReset();
  catalogRefetch.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToolsSection bound tools', () => {
  it('renders effect chips: read-only green, effectful·gated neutral', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getAllByText('read-only').length).toBeGreaterThanOrEqual(1); // lookup_ticket is READ_ONLY
    expect(screen.getByText('effectful · gated')).toBeTruthy(); // refund_payment gated via catalog REQUIRED (its legacy on_effect collapses on the wire — T-04)
  });

  it('expands a row to show the binary approval control with provenance and entry-local switches', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Expand refund_payment settings'));
    const panel = screen.getByText('Approval policy').parentElement!;
    expect(panel).toBeTruthy();
    // Effective state is gated (catalog REQUIRED) → control shows "Require approval".
    expect(within(panel).getByText('Require approval')).toBeTruthy();
    // Provenance is stated, never hidden — catalog REQUIRED decides here.
    expect(screen.getByText(/row escalates/)).toBeTruthy();
    expect(screen.getByText('Entry-local switches')).toBeTruthy();
    expect(screen.getByText('Expose description to planner')).toBeTruthy();
    expect(screen.getByText('Log call payloads')).toBeTruthy();
    // Shadow and stale lint render in the expanded panel.
    expect(screen.getByText(/simulated, executes nothing/)).toBeTruthy();
  });

  it('flipping the binary control writes only always/never — the ternary stays intact', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Expand refund_payment settings'));
    const panel = screen.getByText('Approval policy').parentElement!;
    // Currently gated (catalog REQUIRED); flip to "Run ungated" inside the panel.
    fireEvent.click(within(panel).getByText('Run ungated'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.tools.find((t) => t.name === 'refund_payment')?.approval).toBe('never');
  });

  it('toggling an entry-local switch persists it', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Expand lookup_ticket settings'));
    fireEvent.click(screen.getByLabelText('Log call payloads for lookup_ticket'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.tools.find((t) => t.name === 'lookup_ticket')?.log_call_payloads).toBe(false);
  });

  it('enable toggle writes enabled:false while keeping the entry', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Enable lookup_ticket'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    const entry = payload.definition.tools.find((t) => t.name === 'lookup_ticket');
    expect(entry?.enabled).toBe(false);
    expect(payload.definition.tools.map((t) => t.name)).toContain('lookup_ticket');
  });

  it('unbinds via the row menu and autosaves the draft without it', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('More actions for lookup_ticket'));
    fireEvent.click(screen.getByText('Unbind'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.tools.map((t) => t.name)).toEqual(['refund_payment', 'sync_crm']);
  });

  it('re-pins a stale entry to the live hash from the row menu', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    // sync_crm holds c*64; the catalog row is at f*64 v7 → stale with re-pin.
    fireEvent.click(screen.getByLabelText('More actions for sync_crm'));
    fireEvent.click(screen.getByText('Re-pin to v7'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.tools.find((t) => t.name === 'sync_crm')?.schema_hash).toBe('f'.repeat(64));
  });

  it('flips shadow from the row menu and saves the mode', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('More actions for lookup_ticket'));
    fireEvent.click(screen.getByText('Shadow mode'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.tools.find((t) => t.name === 'lookup_ticket')?.execution_mode).toBe('shadow');
  });

  it('normalizes legacy entries missing the new fields to the redesign defaults', async () => {
    vi.useFakeTimers();
    const legacy = [
      { name: 'lookup_ticket', access: 'read', approval: 'never', execution_mode: 'live' },
    ] as unknown as AgentDefinition['tools'];
    await act(async () => {
      shell({ definition: definitionWith(legacy) });
    });
    // Normalization alone converges dirty-checking (nothing to save); a real
    // write carries the normalized fields through the payload.
    fireEvent.click(screen.getByLabelText('Expand lookup_ticket settings'));
    fireEvent.click(screen.getByLabelText('Log call payloads for lookup_ticket'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    const entry = payload.definition.tools.find((t) => t.name === 'lookup_ticket');
    expect(entry?.enabled).toBe(true);
    expect(entry?.expose_description_to_planner).toBe(true);
    expect(entry?.log_call_payloads).toBe(false); // the one the test flipped
  });
});

describe('ToolsSection catalog', () => {
  it('binds a catalog row with the new entry fields defaulted on', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByPlaceholderText(/Filter by name/), { target: { value: 'export_report' } });
    fireEvent.click(screen.getByText('Bind'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    const entry = payload.definition.tools.find((t) => t.name === 'export_report');
    expect(entry).toBeTruthy();
    expect(entry?.enabled).toBe(true);
    expect(entry?.expose_description_to_planner).toBe(true);
    expect(entry?.log_call_payloads).toBe(true);
    expect(entry?.schema_hash).toBe('e'.repeat(64));
  });

  it('holds binding past the 50-entry cap with a named message', async () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      name: `tool_${i}`, access: 'read' as const, approval: 'never' as const, execution_mode: 'live' as const,
      enabled: true, expose_description_to_planner: true, log_call_payloads: true,
    }));
    await act(async () => {
      shell({ definition: definitionWith(many) });
    });
    fireEvent.change(screen.getByPlaceholderText(/Filter by name/), { target: { value: 'export_report' } });
    fireEvent.click(screen.getByText('Bind'));
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(expect.stringMatching(/Tool limit reached \(50\)/));
  });

  it('drift Re-check refetches the catalog instead of claiming freshness', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText('Re-check'));
    expect(catalogRefetch).toHaveBeenCalledTimes(1);
  });
});

describe('ToolsSection approvals', () => {
  it('surfaces the ungated count in the header pill and the ungated list', async () => {
    await act(async () => {
      shell();
    });
    // sync_crm: MUTATING (effectful), approval never, agent default never → ungated.
    expect(screen.getByText('1 ungated effectful')).toBeTruthy();
    expect(screen.getByText('Ungated effectful binds')).toBeTruthy();
    expect(screen.getByText('Open Approvals →')).toBeTruthy();
  });

  it('"Gate it" writes approval always on the entry', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText('Gate it'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.tools.find((t) => t.name === 'sync_crm')?.approval).toBe('always');
  });

  it('flipping the agent default writes effectful_approval_default with the draft', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText('Default for effectful tools').parentElement!.querySelectorAll('button')[1]);
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.effectful_approval_default).toBe('always');
  });
});

describe('ToolsSection roles', () => {
  it('renders viewers read-only with the role explanation', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    expect(screen.getByText(/This action requires/)).toBeTruthy();
    expect(screen.queryByText('Bind')).toBeNull();
    expect(screen.queryByLabelText('Enable lookup_ticket')).toBeNull();
  });
});
