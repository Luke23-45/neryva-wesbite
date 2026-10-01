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
  /** Sibling sources: sib-1 carries published + draft, sib-2 is draft-only. */
  const siblingSources = (id: string | null) =>
    id === 'agent-sib-1'
      ? {
          published: {
            definition: { ...defaultConsumer(), instructions: 'Handle it well.' },
            versionId: 'v7',
            hash: 'h7',
            status: 'PUBLISHED',
          },
          draft: {
            definition: { ...defaultConsumer(), instructions: 'Handle it well — draft edit.' },
            versionId: 'v9',
            hash: 'h9',
            status: 'DRAFT',
          },
        }
      : {
          published: null,
          draft: {
            definition: { ...defaultConsumer(), instructions: '## Role\nSecond brain.\n\nSecond line here.' },
            versionId: 'v9',
            hash: 'h9',
            status: 'DRAFT',
          },
        };
  return {
    ...actual,
    useAssistantDefinition: (id: string | null, opts?: { prefer?: 'draft' | 'active' }) => {
      const sources = siblingSources(id);
      // Mirrors the real hook: prefer 'active' resolves published ?? draft.
      const source = (opts?.prefer === 'active' ? sources.published ?? sources.draft : sources.draft ?? sources.published)!;
      return {
        data: {
          definition: source.definition,
          versionId: source.versionId,
          hash: source.hash,
          status: source.status,
          isDraft: sources.draft !== null,
          isLive: sources.published !== null,
          activeSource: sources.published,
          draftSource: sources.draft,
        },
        isPending: false,
        isFetching: false,
        isError: false,
      };
    },
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
    const blocks = onInsert.mock.calls[0][0] as Array<{ kind: string; mode: string; content: string }>;
    expect(blocks).toEqual([{ kind: 'custom', mode: 'markdown', content: '## Role\nTriage nurse.' }]);
    // The version toast fires on the real save (doSave), never at insert time.
    expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
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
    expect(screen.getAllByText(/From your org’s agents · /).length).toBeGreaterThan(0);
  });

  it('labels org-row provenance and prefers the published version', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Org prompt history'));
    await screen.findByText('Sibling One');
    // sib-1 has published + draft: the row copies the serving version and
    // names its provenance. sib-2 is draft-only: labeled Draft honestly.
    expect(screen.getByText('From your org’s agents · Published')).toBeTruthy();
    expect(screen.getByText('From your org’s agents · Draft')).toBeTruthy();
  });

  it('copies the published text by default; the draft only on explicit choice', async () => {
    let onInsert!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onInsert } = shell());
    });
    fireEvent.click(screen.getByLabelText('Org prompt history'));
    await screen.findByText('Sibling One');
    fireEvent.click(screen.getByText('Sibling One'));
    // Default copy is the published text, with provenance in the source tag.
    const first = onInsert.mock.calls[0];
    expect(first[0]).toEqual([{ kind: 'rules', mode: 'markdown', content: 'Handle it well.' }]);
    expect(first[1]).toBe('org agent Sibling One · published');
    // Explicitly choosing Draft copies the draft text instead — never silently.
    fireEvent.click(screen.getByRole('tab', { name: 'Draft' }));
    expect(screen.getAllByText('From your org’s agents · Draft').length).toBe(2);
    fireEvent.click(screen.getByText('Sibling One'));
    const second = onInsert.mock.calls[1];
    expect(second[0]).toEqual([{ kind: 'rules', mode: 'markdown', content: 'Handle it well — draft edit.' }]);
    expect(second[1]).toBe('org agent Sibling One · draft');
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
    const first = onInsert.mock.calls[0][0] as Array<{ kind: string }>;
    const second = onInsert.mock.calls[1][0] as Array<{ kind: string }>;
    expect(first[0].kind).toBe('rules');
    expect(second[0].kind).toBe('custom');
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

describe('SamplesSection controlled open state (I-BUG12)', () => {
  it('lets the parent drive the collapse state via open/onOpenChange', async () => {
    const onOpenChange = vi.fn();
    await act(async () => {
      shell({ startOpen: true, open: false, onOpenChange });
    });
    // Controlled closed wins over startOpen — the gallery stays hidden.
    expect(screen.queryByText('Support Triage')).toBeNull();
    expect(screen.getByRole('button', { name: /use a sample/i }).getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: /use a sample/i }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Internal state is NOT flipped in controlled mode — the parent owns it.
    expect(screen.queryByText('Support Triage')).toBeNull();
  });

  it('keeps the uncontrolled startOpen seed when no controlled props are given', async () => {
    await act(async () => {
      shell({ startOpen: false });
    });
    expect(screen.queryByText('Support Triage')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /use a sample/i }));
    expect(screen.getByText('Support Triage')).toBeTruthy();
  });
});

describe('SamplesSection disabled-row explanations (W-5)', () => {
  it('keeps view-only rows explainable: focusable, titled, described by the notice', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    // The gallery notice carries the id the rows reference.
    const note = screen.getByText(/Viewing only — samples are browsable/);
    expect(note.getAttribute('id')).toBe('samples-viewonly-note');
    const row = screen.getByText('Support Triage').closest('button')!;
    // aria-disabled, never native disabled: the row stays in the tab order
    // and the title tooltip can actually render — a native `title` never
    // shows on a `disabled` button (disabled controls fire no mouse events).
    expect(row.hasAttribute('disabled')).toBe(false);
    expect(row.getAttribute('aria-disabled')).toBe('true');
    expect(row.getAttribute('title')).toMatch(/insert from the Instructions section/);
    expect(row.getAttribute('aria-describedby')).toBe('samples-viewonly-note');
  });

  it('never fakes an action on a disabled row (click or keyboard)', async () => {
    let onInsert!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onInsert } = shell({ canAuthor: false }));
    });
    const row = screen.getByText('Support Triage').closest('button')!;
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' });
    expect(onInsert).not.toHaveBeenCalled();
  });

  it('keeps content-disabled rows explained with their own reason', async () => {
    await act(async () => {
      shell();
    });
    const empty = screen.getByText('Empty Blueprint').closest('button')!;
    expect(empty.hasAttribute('disabled')).toBe(false);
    expect(empty.getAttribute('aria-disabled')).toBe('true');
    expect(empty.getAttribute('title')).toBe('This blueprint carries no starter text.');
    const scaffold = screen.getByText('Reviewed starter set').closest('button')!;
    expect(scaffold.getAttribute('aria-disabled')).toBe('true');
    expect(scaffold.getAttribute('title')).toMatch(/unwritten — this row ships no text until reviewed/);
  });

  it('describes view-only org rows by the notice, not the insert copy', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    fireEvent.click(screen.getByLabelText('Org prompt history'));
    await screen.findByText('Sibling One');
    const row = screen.getByText('Sibling One').closest('button')!;
    expect(row.getAttribute('aria-disabled')).toBe('true');
    expect(row.getAttribute('title')).toMatch(/insert from the Instructions section/);
    expect(row.getAttribute('aria-describedby')).toBe('samples-viewonly-note');
  });
});
