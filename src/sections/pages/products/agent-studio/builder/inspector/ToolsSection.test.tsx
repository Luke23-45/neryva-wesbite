// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import toast from 'react-hot-toast';
import { ToolsSection } from './ToolsSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const saveMutate = vi.fn();
const updateMutate = vi.fn();

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
    useToolCatalog: () => ({ data: CATALOG, isPending: false, isError: false }),
    useToolTemplates: () => ({ data: [], isPending: false, isError: false }),
  };
});

function definitionWith(tools: AgentDefinition['tools']): AgentDefinition {
  const def = defaultConsumer();
  return { ...def, instructions: '## Role\nR.\n', tools };
}

const BOUND: AgentDefinition['tools'] = [
  { name: 'lookup_ticket', access: 'read', approval: 'never', schema_hash: 'a'.repeat(64), execution_mode: 'live' },
  { name: 'refund_payment', access: 'write', approval: 'on_effect', schema_hash: 'b'.repeat(64), execution_mode: 'shadow' },
  { name: 'sync_crm', access: 'read', approval: 'never', schema_hash: 'c'.repeat(64), execution_mode: 'live' },
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
          {...props}
        />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  saveMutate.mockReset();
  updateMutate.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToolsSection entries', () => {
  it('renders pin states: covered, shadow, and stale with re-pin', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getAllByText('lookup_ticket').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/simulated, executes nothing/)).toBeTruthy();
    expect(screen.getByText(/Catalog is at v7/)).toBeTruthy();
    expect(screen.getByText('Re-pin to v7')).toBeTruthy();
  });

  it('unbinds an entry and autosaves the draft without it', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getAllByText('Unbind')[0]);
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.tools.map((t) => t.name)).toEqual(['refund_payment', 'sync_crm']);
  });

  it('re-pins a stale entry to the live hash', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    // sync_crm holds c*64; the catalog row is at f*64 v7 → stale with re-pin.
    fireEvent.click(screen.getByText('Re-pin to v7'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.tools.find((t) => t.name === 'sync_crm')?.schema_hash).toBe('f'.repeat(64));
  });

  it('flips shadow and saves the mode', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Shadow lookup_ticket'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.tools.find((t) => t.name === 'lookup_ticket')?.execution_mode).toBe('shadow');
  });

  it('holds binding past the 32-entry cap with a named message', async () => {
    const many = Array.from({ length: 32 }, (_, i) => ({
      name: `tool_${i}`, access: 'read' as const, approval: 'never' as const, execution_mode: 'live' as const,
    }));
    await act(async () => {
      shell({ definition: definitionWith(many) });
    });
    fireEvent.change(screen.getByPlaceholderText(/Filter by name/), { target: { value: 'export_report' } });
    fireEvent.click(screen.getByText('Bind with hash pin'));
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(expect.stringMatching(/Tool limit reached \(32\)/));
  });
});

describe('ToolsSection approvals', () => {
  it('lists approval-required entries with the runtime truth and link', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText('Open Approvals →')).toBeTruthy();
    // refund_payment requires via catalog escalation (on_effect + REQUIRED row).
    expect(screen.getAllByText('refund_payment').length).toBeGreaterThanOrEqual(2);
  });
});

describe('ToolsSection roles', () => {
  it('renders viewers read-only with the role explanation', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    expect(screen.getByText(/Binding needs/)).toBeTruthy();
    expect(screen.queryByText('Bind with hash pin')).toBeNull();
  });
});
