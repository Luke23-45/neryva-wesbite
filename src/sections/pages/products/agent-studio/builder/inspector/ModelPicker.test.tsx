// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import type { ModelAvailability, ModelCost } from '@hooks/studio/useSetupModels';
import { ModelPicker } from './ModelPicker';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    // Locked-row subscription links stand in as plain anchors — routing is
    // out of scope for catalog tests; the href is what we assert.
    Link: ({ children, to }: { children?: ReactNode; to?: string }) => <a href={to ?? '#'}>{children}</a>,
  };
});

const CATALOG: ModelAvailability[] = [
  { provider: 'anthropic', modelId: 'claude-sonnet-4-5', ref: 'anthropic/claude-sonnet-4-5', displayName: 'Claude Sonnet 4.5', contextWindowTokens: 200000, maxOutputTokens: 64000, capabilities: { vision: true }, residency: 'us', usable: true, reasons: [], requiredProduct: 'free', requiredProductLabel: 'Free' },
  { provider: 'openai', modelId: 'gpt-5-eu', ref: 'openai/gpt-5-eu', displayName: 'GPT-5 EU', contextWindowTokens: 128000, maxOutputTokens: 32000, capabilities: {}, residency: 'eu', usable: false, reasons: ['residency_incompatible'], requiredProduct: null, requiredProductLabel: null },
  { provider: 'deepseek', modelId: 'chat', ref: 'deepseek/chat', displayName: 'DeepSeek Chat', contextWindowTokens: 64000, maxOutputTokens: 8000, capabilities: {}, residency: 'us', usable: false, reasons: ['provider_credential_missing'], requiredProduct: null, requiredProductLabel: null },
  { provider: 'anthropic', modelId: 'claude-opus-4-5', ref: 'anthropic/claude-opus-4-5', displayName: 'Claude Opus 4.5', contextWindowTokens: 200000, maxOutputTokens: 128000, capabilities: {}, residency: 'us', usable: false, reasons: ['subscription_required'], requiredProduct: 'payg', requiredProductLabel: 'Pay-as-you-go' },
];

const COSTS: ModelCost[] = [
  { provider: 'anthropic', model: 'claude-sonnet-4-5', ref: 'anthropic/claude-sonnet-4-5', costMicrosPer1kInput: 3000, costMicrosPer1kOutput: 15000, costMicrosPer1kCachedInput: null, currency: 'USD', effectiveFrom: null },
];

function shell(props?: Partial<React.ComponentProps<typeof ModelPicker>>) {
  const onToggle = vi.fn();
  const onFixRequest = vi.fn();
  const ui = render(
    <ThemeProvider theme={theme}>
      <ModelPicker
        rows={CATALOG}
        costsByRef={new Map(COSTS.map((cost) => [cost.ref, cost]))}
        pipelineRefs={['anthropic/claude-sonnet-4-5']}
        credBlockedRefs={new Set()}
        canAuthor
        isEnterprise
        onToggle={onToggle}
        onFixRequest={onFixRequest}
        {...props}
      />
    </ThemeProvider>,
  );
  return { onToggle, onFixRequest, ui };
}

describe('ModelPicker catalog', () => {
  it('shows usability, costs, capability chips, and reasons with inline fixes', async () => {
    let onFixRequest!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onFixRequest } = shell());
    });
    expect(screen.getByText('Claude Sonnet 4.5')).toBeTruthy();
    expect(screen.getByText(/\$3\.00\/1M in/)).toBeTruthy();
    expect(screen.getByText('Vision')).toBeTruthy();
    expect(screen.getByText(/residency incompatible/)).toBeTruthy();
    // Unusable rows are disabled (never hidden)…
    const gpt = screen.getByLabelText(/GPT-5 EU — unusable/) as HTMLInputElement;
    expect(gpt.disabled).toBe(true);
    // …with the SPEC fix beside the reason.
    fireEvent.click(screen.getByText('Switch profile'));
    expect(onFixRequest).toHaveBeenCalledWith('profile', 'openai/gpt-5-eu');
  });

  it('toggles pipeline membership from the catalog rows', async () => {
    let onToggle!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onToggle } = shell());
    });
    // Add a usable model.
    fireEvent.click(screen.getByLabelText(/GPT-5 EU/));
    // Reorder lives on the pipeline rows now — the picker only toggles.
    expect(onToggle).toHaveBeenCalledWith('openai/gpt-5-eu');
  });

  it('marks models already in the pipeline', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText('In pipeline')).toBeTruthy();
  });

  it('holds the 20-model cap with reason, and filters by search', async () => {
    const pipelineRefs = Array.from({ length: 20 }, (_, i) => `x/m${i}`);
    await act(async () => {
      shell({ pipelineRefs });
    });
    expect(screen.getByText(/20 \/ 20/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Search model catalog'), { target: { value: 'deepseek' } });
    expect(screen.queryByText('Claude Sonnet 4.5')).toBeNull();
    expect(screen.getByText('DeepSeek Chat')).toBeTruthy();
  });

  it('states empty and unreachable catalogs honestly', async () => {
    await act(async () => {
      shell({ rows: [], loadError: true });
    });
    expect(screen.getByText(/Catalog unreachable/)).toBeTruthy();
  });

  it('renders read-only for viewers (states visible, controls dead)', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) expect(box.disabled).toBe(true);
    expect(screen.getByText('Claude Sonnet 4.5')).toBeTruthy();
  });

  it('groups the catalog by provider, never hiding locked rows', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/Anthropic · 2/)).toBeTruthy();
    expect(screen.getByText(/OpenAI · 1/)).toBeTruthy();
    // Locked rows stay visible with the why inline.
    expect(screen.getByText('Claude Opus 4.5')).toBeTruthy();
    expect(screen.getByText(/residency incompatible/)).toBeTruthy();
  });

  it('explains a subscription lock with the product label and a billing link', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/Requires Pay-as-you-go — you don't have that/)).toBeTruthy();
    const link = screen.getByRole('link', { name: /view subscription options/i }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/agent-studio/settings/billing');
  });

  it('degrades honestly when the subscription label is missing', async () => {
    const unlabeled: ModelAvailability = {
      provider: 'x', modelId: 'y', ref: 'x/y', displayName: 'Mystery Model',
      contextWindowTokens: 1000, maxOutputTokens: 100, capabilities: {}, residency: 'us',
      usable: false, reasons: ['subscription_required'], requiredProduct: null, requiredProductLabel: null,
    };
    await act(async () => {
      shell({ rows: [unlabeled] });
    });
    // No tier invented — plain "a subscription".
    expect(screen.getByText(/Requires a subscription — you don't have that/)).toBeTruthy();
  });

  it('keeps a locked pipeline model removable (never a trap)', async () => {
    let onToggle!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onToggle } = shell({ pipelineRefs: ['anthropic/claude-opus-4-5'] }));
    });
    const box = screen.getByLabelText(/Claude Opus 4.5 — unusable/) as HTMLInputElement;
    expect(box.disabled).toBe(false);
    fireEvent.click(box);
    expect(onToggle).toHaveBeenCalledWith('anthropic/claude-opus-4-5');
  });
});
