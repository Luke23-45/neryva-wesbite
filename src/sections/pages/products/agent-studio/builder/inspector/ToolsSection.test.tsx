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

  it('T-BUG1: catalog rows render working expand chevrons with aria-expanded', async () => {
    await act(async () => {
      shell();
    });
    const toggle = screen.getByRole('button', { name: 'Expand lookup_ticket details' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // Chevron is present (the RowChevron icon inside the expand button).
    expect(toggle.querySelector('svg')).toBeTruthy();
    // aria-controls names the detail panel.
    const panelId = toggle.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId as string)).toBeNull(); // collapsed: no panel yet

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Collapse lookup_ticket details');
    const panel = document.getElementById(panelId as string);
    expect(panel).toBeTruthy();
    // Detail content is the catalog metadata, read-only.
    expect(panel?.textContent).toMatch(/Ticket lookup/);
    expect(panel?.textContent).toMatch(/version v3/);
    expect(panel?.textContent).toMatch(/effect class READ_ONLY/);
    expect(panel?.textContent).toMatch(/api\.crm\.example/);

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById(panelId as string)).toBeNull();
  });

  it('T-BUG1: expanding one catalog row leaves the others collapsed', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Expand refund_payment details' }));
    expect(screen.getByRole('button', { name: 'Collapse refund_payment details' }).getAttribute('aria-expanded')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Expand lookup_ticket details' }).getAttribute('aria-expanded')).toBe(
      'false',
    );
    // refund_payment has no description — panel still renders its metadata.
    const panelId = screen
      .getByRole('button', { name: 'Collapse refund_payment details' })
      .getAttribute('aria-controls') as string;
    expect(document.getElementById(panelId)?.textContent).toMatch(/version v2/);
  });

  it('T-BUG1: disabled catalog rows are not offered in the picker (A4-67 holds)', async () => {
    await act(async () => {
      shell();
    });
    // old_tool is enabled:false in the mock catalog — the bind picker lists
    // enabled rows only, so there is no expand toggle for it.
    expect(screen.queryByRole('button', { name: /old_tool details/ })).toBeNull();
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

describe('ToolsSection bind save path (wave 4 item 1)', () => {
  it('bind stages without firing the save mutation synchronously — the shared 8s debounce persists it', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByPlaceholderText(/Filter by name/), { target: { value: 'export_report' } });
    fireEvent.click(screen.getByText('Bind'));
    // Bind only stages the entry: nothing reaches the API until the shared
    // autosave debounce fires — there is no bind-specific immediate save.
    expect(updateMutate).not.toHaveBeenCalled();
    expect(saveMutate).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.tools.map((t) => t.name)).toContain('export_report');
  });
});

describe('ToolsSection "+ Bind from catalog" (wave 4 item 2)', () => {
  it('scrolls without flushing staged state — the staged unbind keeps its own autosave schedule', async () => {
    vi.useFakeTimers();
    // jsdom does not implement scrollIntoView; the button under test only scrolls.
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    await act(async () => {
      shell();
    });
    // Stage an unbind — the 8s autosave is now armed.
    fireEvent.click(screen.getByLabelText('More actions for lookup_ticket'));
    fireEvent.click(screen.getByText('Unbind'));
    expect(updateMutate).not.toHaveBeenCalled();
    // The navigation/scroll button must never flush unrelated staged state.
    fireEvent.click(screen.getByText('+ Bind from catalog'));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
    // The unbind's own autosave fires on schedule — exactly once.
    await act(async () => {
      vi.advanceTimersByTime(7000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.tools.map((t) => t.name)).toEqual(['refund_payment', 'sync_crm']);
  });
});

describe('ToolsSection catalog empty states (wave 4 item 3)', () => {
  it('says no rows match the current filters when the search hides everything', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByPlaceholderText(/Filter by name/), { target: { value: 'zzz-no-such-tool' } });
    expect(screen.getByText('No catalog rows match the current filters.')).toBeTruthy();
    expect(screen.queryByText(/register one in the Tools library/)).toBeNull();
  });

  it('says no rows match the current filters for a combined search + approval filter', async () => {
    await act(async () => {
      shell();
    });
    // lookup_ticket matches the search but its approval is NONE; the approval
    // filter hides it and the search hides everything else.
    fireEvent.change(screen.getByPlaceholderText(/Filter by name/), { target: { value: 'lookup' } });
    fireEvent.click(screen.getByRole('button', { name: 'Filter by approval' }));
    fireEvent.click(screen.getByRole('option', { name: 'Approval · Required' }));
    expect(screen.getByText('No catalog rows match the current filters.')).toBeTruthy();
    expect(screen.queryByText(/register one in the Tools library/)).toBeNull();
  });

  it('clearing the filters restores the catalog rows', async () => {
    await act(async () => {
      shell();
    });
    const input = screen.getByPlaceholderText(/Filter by name/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'zzz-no-such-tool' } });
    expect(screen.getByText('No catalog rows match the current filters.')).toBeTruthy();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByText('No catalog rows match the current filters.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Expand lookup_ticket details' })).toBeTruthy();
  });
});
