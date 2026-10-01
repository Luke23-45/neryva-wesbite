// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import toast from 'react-hot-toast';
import { GuardrailsSection } from './GuardrailsSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const saveMutate = vi.fn();
const updateMutate = vi.fn();
const telemetryData = vi.fn((): { windowDays: number; refusals: { topic: string; refusals: number }[] } | undefined => undefined);

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
    useGuardrailTelemetry: () => ({ data: telemetryData(), isLoading: false, isError: false }),
  };
});

function definitionWith(guardrails: AgentDefinition['guardrails']): AgentDefinition {
  const def = defaultConsumer();
  return { ...def, instructions: '## Role\nR.\n', guardrails };
}

const FULL_GUARDRAILS: AgentDefinition['guardrails'] = {
  pii_redaction: true,
  input_policy: '',
  output_policy: '',
  execution_mode: 'blocking',
  pii_entities: ['email', 'phone', 'payment_card', 'government_id', 'api_keys', 'addresses'],
  pii_action: 'token',
  pii_applies_to: ['storage', 'logs'],
  notify_owner: false,
  attach_to_trace: true,
  deny_topics: [],
};

const FRESH = definitionWith({ ...FULL_GUARDRAILS });

function shell(props?: Partial<React.ComponentProps<typeof GuardrailsSection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <GuardrailsSection
          assistantId="agent-main"
          definition={FRESH}
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
  telemetryData.mockReset();
  telemetryData.mockReturnValue(undefined);
  vi.mocked(toast.success).mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GuardrailsSection', () => {
  it('PII off→on round-trip reports clean (G-BUG3 — value-based dirty, not interaction-based)', async () => {
    const onDirtyChange = vi.fn();
    shell({ onDirtyChange });
    const lastDirty = () => vi.mocked(onDirtyChange).mock.calls.at(-1)?.[0];
    await act(async () => {});
    expect(lastDirty()).toBe(false);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('PII redaction'));
    });
    expect(lastDirty()).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('PII redaction'));
    });
    // Back to the loaded value: no unsaved changes, no phantom dirty.
    expect(lastDirty()).toBe(false);
  });

  it('deny-topic add-then-remove is a clean no-op: no save fires (G-BUG7)', async () => {
    const onDirtyChange = vi.fn();
    shell({ onDirtyChange });
    const calls = vi.mocked(onDirtyChange).mock.calls;
    const lastDirty = () => calls[calls.length - 1]?.[0];
    await act(async () => {});
    expect(lastDirty()).toBe(false);
    const input = screen.getByLabelText('New deny topic');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'temp' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    });
    expect(screen.getByText('temp')).toBeTruthy();
    expect(lastDirty()).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove deny topic temp' }));
    });
    expect(screen.queryByText('temp')).toBeNull();
    // Net no-op under the canonical dirty comparison: clean again, and the
    // debounce window must not produce a phantom save.
    expect(lastDirty()).toBe(false);
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
    expect(saveMutate).not.toHaveBeenCalled();
  });

  it('renders the SectionPage header with a live mode pill and the four safeguard groups', () => {
    shell();
    expect(screen.getByRole('heading', { name: 'Guardrails' })).toBeTruthy();
    expect(screen.getByText(/Blocking · 4 layers/)).toBeTruthy();
    expect(screen.getByText(/What the agent must never let through/)).toBeTruthy();
    expect(screen.getByRole('tablist', { name: 'input screening level' })).toBeTruthy();
    expect(screen.getByRole('tablist', { name: 'output screening level' })).toBeTruthy();
    expect(screen.getByLabelText('PII redaction')).toBeTruthy();
    expect(screen.getByRole('tablist', { name: 'Guardrail execution mode' })).toBeTruthy();
    expect(screen.getAllByText('Deny topics').length).toBeGreaterThanOrEqual(1);
  });

  it('input Off writes the none key and warns that violations pass through', async () => {
    shell();
    const list = screen.getByRole('tablist', { name: 'input screening level' });
    await act(async () => {
      fireEvent.click(within(list).getByRole('tab', { name: 'Off' }));
    });
    expect(screen.getByText(/violations pass through unscreened/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    // 'none' is the console's Off key — the engine resolver honors it as disabled.
    expect(sent.definition.guardrails.input_policy).toBe('none');
  });

  it('output Brand-safe writes brand-safe', async () => {
    shell();
    const list = screen.getByRole('tablist', { name: 'output screening level' });
    await act(async () => {
      fireEvent.click(within(list).getByRole('tab', { name: 'Brand-safe' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.output_policy).toBe('brand-safe');
  });

  it('PII toggle off warns and autosaves', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('PII redaction'));
    });
    expect(screen.getByText(/identifiers reach storage and the provider/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.pii_redaction).toBe(false);
  });

  it('entity chips toggle and ride the same save', async () => {
    shell();
    const chip = screen.getByRole('button', { name: 'Addresses' });
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    await act(async () => {
      fireEvent.click(chip);
    });
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.pii_entities).not.toContain('addresses');
    expect(sent.definition.guardrails.pii_entities).toContain('email');
  });

  it('redaction action writes through; applies-to is pinned to storage (P1)', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Drop sentence' }));
    });
    // P1: the inert Logs/Traces chips are gone — scope is a statement, not a switch.
    expect(screen.queryByRole('button', { name: 'Traces' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Logs' })).toBeNull();
    expect(screen.getByText(/nothing to redact from logs or traces/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.pii_action).toBe('drop');
    // Legacy ['storage','logs'] fixture collapses to the only real sink.
    expect(sent.definition.guardrails.pii_applies_to).toEqual(['storage']);
  });

  it('flipping to logging states the screening law plus the deny exception, updates the pill, and autosaves', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Logging' }));
    });
    expect(screen.getByText(/Logging — screening verdicts recorded; deny topics still refused on contact/)).toBeTruthy();
    expect(screen.getByText(/ships as a new draft/)).toBeTruthy();
    expect(screen.getByText(/Logging · 4 layers/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.execution_mode).toBe('logging');
  });

  it('violation-action chips toggle notify_owner and attach_to_trace', async () => {
    shell();
    const notify = screen.getByRole('button', { name: 'Notify owner' });
    expect(notify.getAttribute('aria-pressed')).toBe('false');
    await act(async () => {
      fireEvent.click(notify);
    });
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.notify_owner).toBe(true);
  });

  it('deny topics add, dedupe, and remove', async () => {
    shell();
    const input = screen.getByLabelText('New deny topic');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'legal advice' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    });
    expect(screen.getByText('legal advice')).toBeTruthy();
    // Duplicate (case-insensitive) is rejected with a message, not added.
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Legal Advice' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    });
    expect(screen.getByText(/already denied/)).toBeTruthy();
    // Remove it.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove deny topic legal advice' }));
    });
    expect(screen.queryByText('legal advice')).toBeNull();
  });

  it('deny-topic rows show real refusal counts, never invented zeros', async () => {
    telemetryData.mockReturnValue({
      windowDays: 30,
      refusals: [{ topic: 'legal advice', refusals: 12 }],
    });
    shell({
      definition: definitionWith({ ...FULL_GUARDRAILS, deny_topics: ['legal advice', 'medical'] }),
    });
    expect(screen.getByText(/12 refusals · 30d/)).toBeTruthy();
    // 'medical' has no telemetry — no count shown, not a zero.
    const medicalRow = screen.getByText('medical').closest('li');
    expect(medicalRow?.textContent).not.toMatch(/refusals/);
  });

  it('shows custom names honestly in Advanced with resolved behavior', async () => {
    shell({ definition: definitionWith({ ...FULL_GUARDRAILS, input_policy: 'acme-lenient' }) });
    expect(screen.getByText(/Custom name “acme-lenient”/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText(/Custom policy names/));
    });
    // The honesty note appears both under the screening row and in Advanced.
    expect(screen.getAllByText(/screens like Default/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/Custom input policy name/)).toBeTruthy();
  });

  it('renders read-only with the role explanation for viewers', () => {
    shell({ canAuthor: false });
    expect(screen.getByText(/need an owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByRole('tablist', { name: 'input screening level' })).toBeNull();
    expect(screen.getByText(/Blocking · 4 layers/)).toBeTruthy();
  });

  it('read-only logging mode states the deny-topic exception, never "nothing refused"', () => {
    shell({ canAuthor: false, definition: definitionWith({ ...FULL_GUARDRAILS, execution_mode: 'logging' }) });
    // The copy appears in the read-only summary and the rail — assert it is
    // present (at least once) and the old "nothing refused" lie is gone.
    expect(screen.getAllByText(/verdicts recorded; deny topics still refused/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/nothing refused/)).toBeNull();
  });
});

describe('GuardrailsSection D-BUG2 deny-topic remove hit box', () => {
  // The × glyph is SUPPOSED to look small (~16–20px rendered). The requirement is
  // a 44px *invisible hit area* with visuals unchanged — delivered via a ::after
  // expansion on the button. This test asserts the hit box, never the glyph size.
  function injectedCss(): string {
    return Array.from(document.head.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n');
  }

  it('remove button has a 44px hit box via ::after while the visible button stays 24px', () => {
    shell({ definition: definitionWith({ ...FULL_GUARDRAILS, deny_topics: ['legal advice'] }) });
    const button = screen.getByRole('button', { name: 'Remove deny topic legal advice' });

    // Visible button: small by design (24px), positioned so the ::after anchors to it.
    const style = getComputedStyle(button);
    expect(style.width).toBe('24px');
    expect(style.height).toBe('24px');
    expect(style.position).toBe('relative');

    // The hit area comes from the injected ::after rule, not from the button's
    // own box and not from the glyph. Find the rule for this button's generated class.
    const css = injectedCss().replace(/\s+/g, '');
    const classTokens = (button.getAttribute('class') ?? '').split(/\s+/).filter((t) => t && !t.startsWith('sc-'));
    expect(classTokens.length).toBeGreaterThan(0);
    const afterRule = classTokens
      .map((token) => {
        const idx = css.indexOf(`.${token}::after{`);
        return idx === -1 ? null : css.slice(idx, css.indexOf('}', idx) + 1);
      })
      .find((rule) => rule !== null);
    expect(afterRule).toBeTruthy();
    // Pseudo-element must exist (content), be absolutely positioned over the
    // button, and expand the hit box by 10px on every side:
    // 24px + 10px + 10px = 44px on both axes.
    expect(afterRule).toMatch(/content:(""|'')/);
    expect(afterRule).toContain('position:absolute');
    expect(afterRule).toContain('inset:-10px');

    // Guard against regression to a glyph-sized hit box: the button's own box is
    // deliberately NOT 44px — if someone "fixes" the measurement by enlarging
    // the visible button, this fails and the ::after contract must be revisited.
    expect(style.width).not.toBe('44px');
  });

  it('the ::after expansion is not clipped by the topic row', () => {
    shell({ definition: definitionWith({ ...FULL_GUARDRAILS, deny_topics: ['legal advice'] }) });
    const row = screen.getByText('legal advice').closest('li');
    expect(row).toBeTruthy();
    const overflow = getComputedStyle(row as HTMLElement).overflow;
    expect(['visible', '']).toContain(overflow);
  });
});

describe('GuardrailsSection switch label duplication', () => {
  it('PII card shows no duplicate switch label — the switch keeps only its accessible name', () => {
    shell();
    // Visible "PII redaction" titles the section owns: the "On this page" rail
    // row, the SectionGroup label, and the card title. The Switch must not add
    // a fourth visible copy — its label prop is the accessible name only.
    expect(screen.getAllByText('PII redaction')).toHaveLength(3);
    const toggle = screen.getByRole('switch', { name: 'PII redaction' });
    expect(toggle.getAttribute('aria-label')).toBe('PII redaction');
  });
});

describe('GuardrailsSection rail deny-topic count (Wave 4 item 7)', () => {
  function denyTopicRailRow() {
    const card = screen.getByText('On this page').closest('div') as HTMLElement;
    const label = within(card).getByText('Deny topics');
    // RailLabel's parent is the RailRow; the count lives in its RailValue.
    return (label.parentElement ?? label) as HTMLElement;
  }

  it('renders 0 — never "none" — when no deny topics exist', () => {
    shell();
    const row = denyTopicRailRow();
    expect(within(row).getByText('0')).toBeTruthy();
    expect(within(row).queryByText('none')).toBeNull();
  });

  it('renders the live count when deny topics exist', () => {
    shell({ definition: definitionWith({ ...FULL_GUARDRAILS, deny_topics: ['legal advice', 'medical'] }) });
    expect(within(denyTopicRailRow()).getByText('2')).toBeTruthy();
  });
});

describe('GuardrailsSection deny-topic paste cap (Wave 4 item 8)', () => {
  it('pasting more than 200 chars truncates with an inline message, never silently', async () => {
    shell();
    const input = screen.getByLabelText('New deny topic') as HTMLInputElement;
    await act(async () => {
      fireEvent.paste(input, { clipboardData: { getData: () => 'x'.repeat(250) } });
    });
    expect(screen.getByText('Pasted text was cut to 200 characters.')).toBeTruthy();
    expect(input.value).toHaveLength(200);
  });

  it('pasting within the cap shows no truncation message', async () => {
    shell();
    const input = screen.getByLabelText('New deny topic');
    await act(async () => {
      fireEvent.paste(input, { clipboardData: { getData: () => 'short topic' } });
    });
    expect(screen.queryByText('Pasted text was cut to 200 characters.')).toBeNull();
  });
});
