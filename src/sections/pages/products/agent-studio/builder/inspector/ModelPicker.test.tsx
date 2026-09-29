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
  { provider: 'anthropic', modelId: 'claude-sonnet-4-5', ref: 'anthropic/claude-sonnet-4-5', displayName: 'Claude Sonnet 4.5', contextWindowTokens: 200000, maxOutputTokens: 64000, capabilities: {}, residency: 'us', usable: true, reasons: [], requiredProduct: 'free', requiredProductLabel: 'Free' },
  { provider: 'openai', modelId: 'gpt-5-eu', ref: 'openai/gpt-5-eu', displayName: 'GPT-5 EU', contextWindowTokens: 128000, maxOutputTokens: 32000, capabilities: {}, residency: 'eu', usable: false, reasons: ['residency_incompatible'], requiredProduct: null, requiredProductLabel: null },
  { provider: 'deepseek', modelId: 'chat', ref: 'deepseek/chat', displayName: 'DeepSeek Chat', contextWindowTokens: 64000, maxOutputTokens: 8000, capabilities: {}, residency: 'us', usable: false, reasons: ['provider_credential_missing'], requiredProduct: null, requiredProductLabel: null },
  { provider: 'anthropic', modelId: 'claude-opus-4-5', ref: 'anthropic/claude-opus-4-5', displayName: 'Claude Opus 4.5', contextWindowTokens: 200000, maxOutputTokens: 128000, capabilities: {}, residency: 'us', usable: false, reasons: ['subscription_required'], requiredProduct: 'payg', requiredProductLabel: 'Pay-as-you-go' },
];

const COSTS: ModelCost[] = [
  { provider: 'anthropic', model: 'claude-sonnet-4-5', ref: 'anthropic/claude-sonnet-4-5', costMicrosPer1kInput: 3000, costMicrosPer1kOutput: 15000, costMicrosPer1kCachedInput: null, currency: 'USD', effectiveFrom: null },
];

function shell(props?: Partial<React.ComponentProps<typeof ModelPicker>>) {
  const onChange = vi.fn();
  const onFixRequest = vi.fn();
  const ui = render(
    <ThemeProvider theme={theme}>
      <ModelPicker
        allowed={['anthropic/claude-sonnet-4-5']}
        catalog={CATALOG}
        catalogError={false}
        costs={COSTS}
        canAuthor
        onChange={onChange}
        onFixRequest={onFixRequest}
        {...props}
      />
    </ThemeProvider>,
  );
  return { onChange, onFixRequest, ui };
}

describe('ModelPicker catalog', () => {
  it('shows usability, costs, and reasons with inline fixes', async () => {
    let onFixRequest!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onFixRequest } = shell());
    });
    expect(screen.getByText('Claude Sonnet 4.5')).toBeTruthy();
    expect(screen.getByText(/\$0\.0030\/1k in/)).toBeTruthy();
    expect(screen.getByText(/residency incompatible/)).toBeTruthy();
    // Unusable rows are disabled (never hidden)…
    const gpt = screen.getByLabelText(/GPT-5 EU — unusable/) as HTMLInputElement;
    expect(gpt.disabled).toBe(true);
    // …with the SPEC fix beside the reason.
    fireEvent.click(screen.getByText('Switch profile'));
    expect(onFixRequest).toHaveBeenCalledWith('profile', 'openai/gpt-5-eu');
  });

  it('toggles membership and reorders the fallback chain', async () => {
    let onChange!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onChange } = shell({ allowed: ['anthropic/claude-sonnet-4-5', 'deepseek/chat'] }));
    });
    // Remove second.
    fireEvent.click(screen.getByLabelText('Remove deepseek/chat'));
    expect(onChange).toHaveBeenCalledWith(['anthropic/claude-sonnet-4-5']);
    // Move first down.
    fireEvent.click(screen.getByLabelText('Move anthropic/claude-sonnet-4-5 down'));
    expect(onChange).toHaveBeenCalledWith(['deepseek/chat', 'anthropic/claude-sonnet-4-5']);
  });

  it('holds the 20-model cap with reason, and filters by search', async () => {
    const allowed = Array.from({ length: 20 }, (_, i) => `x/m${i}`);
    await act(async () => {
      shell({ allowed });
    });
    expect(screen.getByText(/20-model cap/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Search model catalog'), { target: { value: 'deepseek' } });
    expect(screen.queryByText('Claude Sonnet 4.5')).toBeNull();
    expect(screen.getByText('DeepSeek Chat')).toBeTruthy();
  });

  it('states empty and unreachable catalogs honestly', async () => {
    await act(async () => {
      shell({ catalog: [] });
    });
    expect(screen.getByText(/nothing can ship until staff publishes/)).toBeTruthy();
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

  it('groups the catalog into usable and locked, never hiding locked rows', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/USABLE · 1/)).toBeTruthy();
    expect(screen.getByText(/LOCKED · 3/)).toBeTruthy();
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
      shell({ catalog: [unlabeled] });
    });
    // No tier invented — plain "a subscription".
    expect(screen.getByText(/Requires a subscription — you don't have that/)).toBeTruthy();
  });

  it('keeps a locked selected model removable (never a trap)', async () => {
    let onChange!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onChange } = shell({ allowed: ['anthropic/claude-opus-4-5'] }));
    });
    const box = screen.getByLabelText(/Claude Opus 4.5 — unusable/) as HTMLInputElement;
    expect(box.disabled).toBe(false);
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
