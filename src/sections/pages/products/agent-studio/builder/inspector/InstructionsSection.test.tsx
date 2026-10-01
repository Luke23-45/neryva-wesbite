// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { ApiError } from '@lib/engine/client';
import toast from 'react-hot-toast';
import { InstructionsSection } from './InstructionsSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const { engineMock, toastFn } = vi.hoisted(() => {
  // I-BUG10: the delete-undo affordance is a render-function toast, so the
  // mock must be callable — success/error/dismiss ride on the same fn.
  const t = vi.fn() as Mock & {
    success: Mock;
    error: Mock;
    dismiss: Mock;
  };
  t.success = vi.fn();
  t.error = vi.fn();
  t.dismiss = vi.fn();
  return { engineMock: vi.fn(), toastFn: t };
});
const saveMutate = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: toastFn,
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@lib/engine/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lib/engine/client')>();
  return { ...actual, engine: engineMock };
});

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useSaveDraftVersion: () => ({ mutate: saveMutate, isPending: false }),
  };
});

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({ data: [], isPending: false, isError: false }),
}));

vi.mock('@hooks/studio/useSetupTemplates', () => ({
  useAssistantTemplates: () => ({ data: [], isPending: false, isError: false }),
}));

/** The samples gallery is covered by its own test file; here it is a stub
 *  that exposes the insert path the section must wire to a structured PUT —
 *  and the controlled open state the section root owns (I-BUG12). */
vi.mock('./SamplesSection', () => ({
  SamplesSection: ({
    canAuthor,
    open,
    onOpenChange,
    onInsert,
  }: {
    canAuthor: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onInsert: (blocks: unknown[], source: string) => void;
  }) =>
    canAuthor ? (
      <>
        <button type="button" aria-expanded={open} onClick={() => onOpenChange?.(!open)}>
          samples-toggle
        </button>
        <button
          type="button"
          onClick={() => onInsert([{ kind: 'rules', mode: 'markdown', content: 'Sample rule' }], 'test sample')}
        >
          insert-sample
        </button>
      </>
    ) : null,
}));

vi.mock('./BrandSamples', () => ({
  BrandSamples: () => null,
}));

const DOC = {
  schemaVersion: 1,
  objective: { mode: 'markdown', content: 'Concierge.' },
  output: { mode: 'markdown', content: 'Help guests.' },
  refusal: { mode: 'raw', content: '' },
  rules: [{ id: 'ins_abcdef123456', mode: 'markdown', content: 'Be kind.' }],
  examples: [],
  custom: [],
};

const GET_OK = {
  schema_version: 1,
  instructions: DOC,
  compiled: { text: '## Objective\nConcierge.', hash: 'h0' },
  hash: 'h1',
};

const PREVIEW_OK = {
  text: '## Objective\nConcierge.\n\n## Output\nHelp guests.\n\n## Rules\n- Be kind.\n',
  hash: 'ph1',
  compiler_version: '1.0.0',
  blocks: [
    { kind: 'objective', block_id: null, title: null, empty: false },
    { kind: 'output', block_id: null, title: null, empty: false },
    { kind: 'rules', block_id: 'ins_abcdef123456', title: null, empty: false },
  ],
};

const PUT_OK = { version_id: 'v1', hash: 'h2', compiled: { text: 'x', hash: 'ch2' } };

const DEFINITION = {
  instructions: '## Objective\nConcierge.\n',
  name: 'Test agent',
} as unknown as AgentDefinition;

function shell(props?: Partial<React.ComponentProps<typeof InstructionsSection>>) {
  const onDirtyChange = vi.fn();
  const r = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InstructionsSection
          assistantId="agent-main"
          definition={DEFINITION}
          versionId="v1"
          versionHash="h1"
          isDraft
          canAuthor
          onDirtyChange={onDirtyChange}
          saveSignal={0}
          {...props}
        />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { ...r, onDirtyChange };
}

function defaultEngine() {
  engineMock.mockImplementation((path: string, opts: { method?: string } = {}) => {
    if (opts.method === 'POST' && path.endsWith('/preview')) return Promise.resolve(PREVIEW_OK);
    if (opts.method === 'PUT') return Promise.resolve(PUT_OK);
    return Promise.resolve(GET_OK);
  });
}

beforeEach(() => {
  engineMock.mockReset();
  saveMutate.mockReset();
  toastFn.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(toastFn.dismiss).mockReset();
  defaultEngine();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Autosave is an 8s debounce and preview a 600ms debounce — fake timers scoped per test. */
function withFakeTimers() {
  vi.useFakeTimers();
}

async function bootWithDoc(props?: Partial<React.ComponentProps<typeof InstructionsSection>>) {
  // Fake timers from the start. React Query's initial fetch needs timer ticks
  // even on the happy path, and the fetch/notify cycle can span more than one
  // act flush — so advance until the document lands (bounded).
  withFakeTimers();
  const s = shell(props);
  for (let i = 0; i < 10; i++) {
    await act(async () => {
      vi.advanceTimersByTime(50);
    });
    if (screen.queryByText('Concierge.')) break;
  }
  screen.getByText('Concierge.');
  return s;
}

/** Open a collapsed card's focused editor. Cards share their accessible name
 *  with the pencil icon inside them — the card itself is the first match. */
function openCard(name: string) {
  fireEvent.click(screen.getAllByRole('button', { name: `Edit ${name}` })[0]);
}

/** The editor's non-destructive back link (section label is "Instructions"). */
function backToPage() {
  fireEvent.click(screen.getByRole('button', { name: 'Back to Instructions' }));
}

function doneEditing() {
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
}

function putCalls() {
  return engineMock.mock.calls.filter(([, opts]) => (opts as { method?: string })?.method === 'PUT');
}

/** I-BUG3/4/5: the 44px invisible hit-box contract (mirrors the D-BUG2
 *  pattern). These tests assert the hit box, never the visible size. */
function injectedCss(): string {
  return Array.from(document.head.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n');
}

function afterRuleFor(button: HTMLElement): string | null {
  const css = injectedCss().replace(/\s+/g, '');
  const classTokens = (button.getAttribute('class') ?? '')
    .split(/\s+/)
    .filter((t) => t && !t.startsWith('sc-'));
  expect(classTokens.length).toBeGreaterThan(0);
  return (
    classTokens
      .map((token) => {
        const idx = css.indexOf(`.${token}::after{`);
        return idx === -1 ? null : css.slice(idx, css.indexOf('}', idx) + 1);
      })
      .find((rule) => rule !== null) ?? null
  );
}

function expectHitBox(button: HTMLElement, inset: string) {
  expect(getComputedStyle(button).position).toBe('relative');
  const rule = afterRuleFor(button);
  expect(rule).toBeTruthy();
  expect(rule).toMatch(/content:(""|'')/);
  expect(rule).toContain('position:absolute');
  expect(rule).toContain(`inset:${inset}`);
}

describe('InstructionsSection structured composer', () => {
  it('renders the six area cards and loads the structured document', async () => {
    await act(async () => {
      shell();
    });
    await screen.findByText('Concierge.');
    // Card previews carry the saved content.
    expect(screen.getByText('Help guests.')).toBeTruthy();
    expect(screen.getByText('Be kind.')).toBeTruthy();
    // Non-empty areas appear as a card and in the clickable outline.
    // Empty groups (Examples, Custom) appear only in the outline — no card
    // is rendered for an empty repeatable group.
    for (const label of ['Objective', 'Rules', 'Output', 'Refusal']) {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(2);
    }
    for (const label of ['Examples', 'Custom text']) {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('fires the server preview after the 600ms debounce and shows the compiled text', async () => {
    await bootWithDoc();
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    await act(async () => {});
    // The compiled card always shows the server-produced prompt — no tab needed.
    expect(screen.getByText(/compiler 1\.0\.0/)).toBeTruthy();
    expect(screen.getByText(/## Objective/)).toBeTruthy();
    // The browser never compiles: the preview request went to the engine.
    const previewCall = engineMock.mock.calls.find(
      ([path, opts]) =>
        (opts as { method?: string })?.method === 'POST' && String(path).endsWith('/preview'),
    );
    expect(previewCall).toBeTruthy();
    expect((previewCall![1] as { body: { instructions: typeof DOC } }).body.instructions.objective.content).toBe('Concierge.');
  });

  it('PUTs the structured document with If-Match after Done and the autosave debounce', async () => {
    await bootWithDoc();
    openCard('Objective');
    fireEvent.change(screen.getByDisplayValue('Concierge.'), { target: { value: 'Concierge!!' } });
    doneEditing();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    const puts = putCalls();
    expect(puts.length).toBe(1);
    const [path, opts] = puts[0] as [string, { headers?: Record<string, string>; body: { instructions: typeof DOC } }];
    expect(path).toBe('/console/org/org-test/assistants/agent-main/versions/v1/instructions');
    expect(opts.headers?.['If-Match']).toBe('h1');
    expect(opts.body.instructions.objective.content).toBe('Concierge!!');
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringMatching(/every save is a version/));
  });

  it('opens the 412 conflict dialog on a stale hash instead of overwriting', async () => {
    engineMock.mockImplementation((path: string, opts: { method?: string } = {}) => {
      if (opts.method === 'POST' && path.endsWith('/preview')) return Promise.resolve(PREVIEW_OK);
      if (opts.method === 'PUT') {
        return Promise.reject(new ApiError(412, 'conflict', 'stale', { current: 'h2' }));
      }
      return Promise.resolve(GET_OK);
    });
    await bootWithDoc();
    openCard('Objective');
    fireEvent.change(screen.getByDisplayValue('Concierge.'), { target: { value: 'Concierge!!' } });
    doneEditing();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(putCalls().length).toBe(1);
    expect(screen.getByText('Someone saved first — merge or reload')).toBeTruthy();
  });

  it('creates a draft and chains the structured PUT when versionless', async () => {
    saveMutate.mockImplementationOnce((_input: unknown, opts?: { onSuccess?: (v: unknown) => void }) => {
      opts?.onSuccess?.({ version: { id: 'v2', hash: 'h0' } });
    });
    render(
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <InstructionsSection
            assistantId="agent-main"
            definition={{ ...DEFINITION, instructions: '' }}
            versionId={null}
            versionHash={null}
            isDraft={false}
            canAuthor
            onDirtyChange={() => undefined}
            saveSignal={0}
          />
        </QueryClientProvider>
      </ThemeProvider>,
    );
    // Versionless boots a local blank document — the Objective card is empty.
    // (The edit affordance appears in both the card and the section header.)
    await screen.findAllByRole('button', { name: 'Edit Objective' });
    openCard('Objective');
    await screen.findByPlaceholderText('One breath.');
    withFakeTimers();
    fireEvent.change(screen.getByPlaceholderText('One breath.'), { target: { value: 'Hello.' } });
    doneEditing();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(saveMutate).toHaveBeenCalledTimes(1);
    const puts = putCalls();
    expect(puts.length).toBe(1);
    const [path, opts] = puts[0] as [string, { headers?: Record<string, string>; body: { instructions: typeof DOC } }];
    expect(path).toBe('/console/org/org-test/assistants/agent-main/versions/v2/instructions');
    expect(opts.headers?.['If-Match']).toBe('h0');
    expect(opts.body.instructions.objective.content).toBe('Hello.');
  });

  it('holds the save and states the reason on invalid JSON in the editor', async () => {
    await bootWithDoc();
    openCard('Objective');
    // The editor's surface switcher moves this block to JSON…
    fireEvent.click(screen.getByRole('tab', { name: 'JSON' }));
    const area = screen.getByLabelText('JSON content');
    fireEvent.change(area, { target: { value: '{"broken":' } });
    // …the draft pushes into the section after 2s; back out to read the hold.
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    backToPage();
    // The blocker text is split across elements (label + message), so use a
    // function matcher. Multiple ancestors match — assert at least one does.
    const blockers = screen.getAllByText((_, el) =>
      el?.textContent?.includes('Not valid JSON') ?? false
    );
    expect(blockers.length).toBeGreaterThan(0);
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(putCalls().length).toBe(0);
  });

  it('explicit Save while held toasts the reason instead of swallowing the click', async () => {
    const { rerender } = await bootWithDoc();
    openCard('Objective');
    fireEvent.click(screen.getByRole('tab', { name: 'JSON' }));
    fireEvent.change(screen.getByLabelText('JSON content'), { target: { value: '{"broken":' } });
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    backToPage();
    await act(async () => {
      rerender(
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <InstructionsSection
              assistantId="agent-main"
              definition={DEFINITION}
              versionId="v1"
              versionHash="h1"
              isDraft
              canAuthor
              onDirtyChange={() => undefined}
              saveSignal={1}
            />
          </QueryClientProvider>
        </ThemeProvider>,
      );
    });
    expect(putCalls().length).toBe(0);
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(expect.stringMatching(/Not valid JSON/));
  });

  it('switching a block to JSON with invalid JSON shows the inline warning, and the wrap fix clears it', async () => {
    await bootWithDoc();
    openCard('Objective');
    fireEvent.click(screen.getByRole('tab', { name: 'JSON' }));
    // 'Concierge.' is not valid JSON — the surface's inline warning shows.
    // (V8's message is lowercase "not valid JSON"; match case-insensitively.)
    expect(screen.getAllByText(/not valid json/i).length).toBeGreaterThanOrEqual(1);
    // Wrapping as a JSON string clears the hold.
    fireEvent.click(screen.getByText('Wrap as a JSON string'));
    expect(screen.queryByText(/not valid json/i)).toBeNull();
    doneEditing();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    const puts = putCalls();
    expect(puts.length).toBe(1);
    const body = (puts[0][1] as { body: { instructions: typeof DOC } }).body.instructions;
    expect(body.objective.content).toBe('"Concierge."');
    expect(body.objective.mode).toBe('json');
  });

  it('whispers on a pasted secret and never fires the PUT', async () => {
    await bootWithDoc();
    // Rules are edited per rule — open the first one.
    fireEvent.click(screen.getByRole('button', { name: 'Edit rule 1' }));
    fireEvent.change(screen.getByDisplayValue('Be kind.'), {
      target: { value: 'api_key: sk-live-1234567890abcdef' },
    });
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    backToPage();
    expect(screen.getByText(/pasted credential/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(putCalls().length).toBe(0);
  });

  it('inserting a sample mints a fresh ins_ id and ships it in the next PUT', async () => {
    await bootWithDoc();
    fireEvent.click(screen.getByText('insert-sample'));
    expect(screen.getByText('Sample rule')).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    const puts = putCalls();
    expect(puts.length).toBe(1);
    const body = (puts[0][1] as { body: { instructions: typeof DOC } }).body.instructions;
    const inserted = body.rules.find((r) => r.content === 'Sample rule');
    expect(inserted).toBeTruthy();
    expect(inserted!.id).toMatch(/^ins_[A-Za-z0-9]{12}$/);
  });

  it('marks the section dirty once the editor draft pushes', async () => {
    const { onDirtyChange } = await bootWithDoc();
    openCard('Objective');
    fireEvent.change(screen.getByDisplayValue('Concierge.'), { target: { value: 'Concierge!!' } });
    // The editor pushes its draft into the section every 2s — that is when
    // the section goes dirty.
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });

  it('renders read-only for viewers with the definition text intact', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    expect(screen.getByText(/Concierge\./)).toBeTruthy();
    expect(screen.queryByDisplayValue('Concierge.')).toBeNull();
    expect(screen.queryByText('insert-sample')).toBeNull();
  });

  it('offers a new draft instead of a composer on a published version', async () => {
    await act(async () => {
      shell({ isDraft: false });
    });
    expect(screen.getByText('Edit in a new draft')).toBeTruthy();
    expect(screen.queryByDisplayValue('Concierge.')).toBeNull();
    fireEvent.click(screen.getByText('Edit in a new draft'));
    expect(saveMutate).toHaveBeenCalledTimes(1);
  });
});

describe('InstructionsSection wave-2: hit boxes, undo deletes, Done label, collapse state, fixed denominator', () => {
  /** Boot with a doc carrying one example, so the example remove-X renders. */
  async function bootWithExample() {
    const docWithExample = {
      ...DOC,
      examples: [
        { id: 'ins_example00001', mode: 'markdown', content: 'User: hi\nAssistant: hello', title: '' },
      ],
    };
    engineMock.mockImplementation((path: string, opts: { method?: string } = {}) => {
      if (opts.method === 'POST' && path.endsWith('/preview')) return Promise.resolve(PREVIEW_OK);
      if (opts.method === 'PUT') return Promise.resolve(PUT_OK);
      return Promise.resolve({ ...GET_OK, instructions: docWithExample });
    });
    return bootWithDoc();
  }

  it('I-BUG3: example remove-X (IconButton) has a 44px hit box via ::after', async () => {
    await bootWithExample();
    // IconButton renders 32×32 (iconSize.lg); inset -6px on every side → 44px.
    expectHitBox(screen.getByRole('button', { name: 'Remove example 1' }), '-6px');
  });

  it('I-BUG4: rule move/delete (RowButton) has a 44px hit box via ::after', async () => {
    await bootWithDoc();
    // RowButton renders 26×26; inset -9px on every side → 44px.
    expectHitBox(screen.getByRole('button', { name: 'Delete rule 1' }), '-9px');
    expectHitBox(screen.getByRole('button', { name: 'Move rule 1 up' }), '-9px');
  });

  it('I-BUG5: AddButton ("Add example" / "Add custom text") has a 44px-tall hit box via ::after', async () => {
    await bootWithDoc();
    // AddButton renders ~31px tall (12px semibold + 7px padding each side);
    // inset -7px top/bottom → ~45px. One shared root covers all three labels.
    expectHitBox(screen.getByRole('button', { name: 'Add example' }), '-7px0');
    expectHitBox(screen.getByRole('button', { name: 'Add custom text' }), '-7px0');
  });

  it('I-BUG10: deleting a rule stages an undo toast that restores the block at its index', async () => {
    await bootWithDoc();
    fireEvent.click(screen.getByRole('button', { name: 'Delete rule 1' }));
    expect(screen.queryByText('Be kind.')).toBeNull();
    // The delete is staged — the server is untouched until the section save —
    // so the protection is an undo affordance, not a confirm gate.
    expect(toastFn).toHaveBeenCalled();
    const renderToast = toastFn.mock.calls[toastFn.mock.calls.length - 1][0] as (t: { id: string }) => ReactElement;
    expect(toastFn.mock.calls[toastFn.mock.calls.length - 1][1]).toEqual({ duration: 8000 });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const toastRender = render(
      <ThemeProvider theme={theme}>{renderToast({ id: 'undo-toast-1' })}</ThemeProvider>,
      { container: host },
    );
    fireEvent.click(toastRender.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText('Be kind.')).toBeTruthy();
    expect(vi.mocked(toastFn.dismiss)).toHaveBeenCalledWith('undo-toast-1');
    toastRender.unmount();
    document.body.removeChild(host);
  });

  it('I-BUG10: the example remove-X routes through the same undo model', async () => {
    await bootWithExample();
    fireEvent.click(screen.getByRole('button', { name: 'Remove example 1' }));
    expect(toastFn).toHaveBeenCalled();
    const renderToast = toastFn.mock.calls[toastFn.mock.calls.length - 1][0] as (t: { id: string }) => ReactElement;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const toastRender = render(
      <ThemeProvider theme={theme}>{renderToast({ id: 'undo-toast-2' })}</ThemeProvider>,
      { container: host },
    );
    fireEvent.click(toastRender.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText(/User: hi/)).toBeTruthy();
    toastRender.unmount();
    document.body.removeChild(host);
  });

  it('I-BUG11: the sub-editor commits to "Done" — the section save is the commit, not the editor', async () => {
    await bootWithDoc();
    openCard('Objective');
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save & close' })).toBeNull();
  });

  it('I-BUG12: the collapsed samples panel survives a sub-editor open/close cycle', async () => {
    await bootWithDoc();
    // DOC is non-empty, so the gallery starts collapsed at the section root.
    const toggle = screen.getByRole('button', { name: 'samples-toggle' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    // Opening a sub-editor unmounts the whole page; closing it remounts.
    openCard('Objective');
    backToPage();
    // The collapse state lives at the root — the remount must not reset it.
    expect(screen.getByRole('button', { name: 'samples-toggle' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('I-BUG13: progress grades over the fixed six blocks, not the item count', async () => {
    await bootWithDoc();
    // DOC: objective ✓, output ✓, refusal ✗, rules group ✓, examples ✗, custom ✗ → 3 of 6.
    expect(screen.getByText('3 of 6 complete')).toBeTruthy();
  });

  it('I-BUG13: the denominator stays 6 after deleting the only rule', async () => {
    await bootWithDoc();
    fireEvent.click(screen.getByRole('button', { name: 'Delete rule 1' }));
    // Deleting the last example/rule/custom must not shrink the denominator
    // ("2 of 2" was the lie); the rules group now grades not-done.
    expect(screen.getByText('2 of 6 complete')).toBeTruthy();
  });
});
