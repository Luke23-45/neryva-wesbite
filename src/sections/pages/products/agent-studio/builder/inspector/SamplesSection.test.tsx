// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import toast from 'react-hot-toast';
import { SamplesSection } from './SamplesSection';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({
    data: [
      {
        id: 'agent-sib-1',
        name: 'Sibling One',
        description: null,
        status: 'live',
        activeVersionId: 'v1',
        model: null,
        updatedAt: '2026-09-16T10:00:00Z',
        degradedUntil: null,
        degradedReason: null,
        disabledReason: null,
      },
      {
        id: 'agent-sib-2',
        name: 'Sibling Two',
        description: null,
        status: 'live',
        activeVersionId: 'v2',
        model: null,
        updatedAt: '2026-09-15T10:00:00Z',
        degradedUntil: null,
        degradedReason: null,
        disabledReason: null,
      },
    ],
    isPending: false,
    isError: false,
  }),
}));

vi.mock('@hooks/studio/useSetupTemplates', () => ({
  useAssistantTemplates: () => ({
    data: [
      {
        template: {
          slug: 'support-triage',
          version: '1',
          status: 'RELEASED',
          family: 'support',
          definition: { instructions: '## Role\nTriage nurse.\n' },
          bindings: { tools: { required: [] }, knowledge: { required: [] }, channels: { channels: [] } },
          evalRef: null,
          releasePolicy: null,
          hash: null,
          minEngineSchema: null,
        },
        available: true,
        compatible: true,
        reasons: [],
        installed: false,
        updateAvailable: 'none',
      },
      {
        template: {
          slug: 'empty-blueprint',
          version: '1',
          status: 'RELEASED',
          family: 'support',
          definition: {},
          bindings: { tools: { required: [] }, knowledge: { required: [] }, channels: { channels: [] } },
          evalRef: null,
          releasePolicy: null,
          hash: null,
          minEngineSchema: null,
        },
        available: true,
        compatible: true,
        reasons: [],
        installed: false,
        updateAvailable: 'none',
      },
    ],
    isPending: false,
    isError: false,
  }),
}));

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistantDefinition: (id: string | null) => ({
      data: {
        definition: {
          ...defaultConsumer(),
          instructions: id === 'agent-sib-1' ? 'Handle it well.' : '## Role\nSecond brain.\n\nSecond line here.',
        },
        versionId: 'v9',
        hash: 'h9',
        status: 'DRAFT',
        isDraft: true,
      },
      isPending: false,
      isFetching: false,
      isError: false,
    }),
  };
});

function shell(props?: Partial<React.ComponentProps<typeof SamplesSection>>) {
  const onInsert = vi.fn();
  const ui = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <SamplesSection assistantId="agent-main" canAuthor startOpen onInsert={onInsert} {...props} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { onInsert, ui };
}

describe('SamplesSection gallery', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  it('appends template starter blocks with provenance intact', async () => {
    let onInsert!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onInsert } = shell());
    });
    expect(screen.getByText('Support Triage')).toBeTruthy();
    fireEvent.click(screen.getByText('Support Triage'));
    expect(onInsert).toHaveBeenCalledTimes(1);
    const blocks = onInsert.mock.calls[0][0] as Array<{ type: string; body: string }>;
    expect(blocks).toEqual([{ id: expect.any(String), type: 'role', title: '', body: 'Triage nurse.' }]);
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringMatching(/every save is a version/));
  });

  it('disables blueprints without starter text and the unreviewed scaffold row', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText('Empty Blueprint')).toBeTruthy();
    expect(screen.getByText('No starter text')).toBeTruthy();
    expect(screen.getByText('Reviewed starter set')).toBeTruthy();
    expect(screen.getByText(/pending review/)).toBeTruthy();
  });

  it('reveals capped org history on opt-in with locked provenance chips', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.queryByText('Sibling One')).toBeNull();
    fireEvent.click(screen.getByLabelText('Org prompt history'));
    expect(await screen.findByText('Sibling One')).toBeTruthy();
    expect(screen.getByText('Sibling Two')).toBeTruthy();
    expect(screen.getAllByText('From your org’s agents').length).toBeGreaterThan(0);
  });

  it('appends org excerpts as rule (single-line) or custom (multi-line)', async () => {
    let onInsert!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onInsert } = shell());
    });
    fireEvent.click(screen.getByLabelText('Org prompt history'));
    await screen.findByText('Sibling One');
    fireEvent.click(screen.getByText('Sibling One'));
    fireEvent.click(screen.getByText('Sibling Two'));
    expect(onInsert).toHaveBeenCalledTimes(2);
    const first = onInsert.mock.calls[0][0] as Array<{ type: string }>;
    const second = onInsert.mock.calls[1][0] as Array<{ type: string }>;
    expect(first[0].type).toBe('rule');
    expect(second[0].type).toBe('custom');
  });

  it('shows the gallery read-only to viewers (provenance intact, no insert)', async () => {
    let onInsert!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onInsert } = shell({ canAuthor: false }));
    });
    expect(screen.getByText(/Viewing only/)).toBeTruthy();
    expect(screen.getByText('Support Triage')).toBeTruthy();
    fireEvent.click(screen.getByText('Support Triage'));
    expect(onInsert).not.toHaveBeenCalled();
  });
});
