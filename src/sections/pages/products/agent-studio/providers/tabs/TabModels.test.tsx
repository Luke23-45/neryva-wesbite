// @vitest-environment jsdom
/**
 * TabModels — targeted coverage:
 * - Both supergroups render; the same model id from Platform Managed AND a
 *   BYOK key is two distinct rows (grouped by source, never conflated).
 * - Tier gating: models above the org tier keep the full row visible with a
 *   disabled switch + explanatory tooltip + Upgrade CTA (never hidden).
 * - usable=false rows show reasons[] as human text.
 * - Toggle-OFF of a pinned_by non-empty model goes through the
 *   blast-radius confirm (cancel aborts, confirm posts the toggle).
 * - Toggle posts the exact N-6 payload (credential_id undefined for
 *   platform, the key UUID for BYOK).
 * - Reasoning presets render display-only with honest "per-assistant in the
 *   builder" copy — no invented write path.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import TabModels from './TabModels';
import type { GroupedModels } from '../hooks/useGroupedModels';

const mutateMock = vi.hoisted(() => vi.fn());

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-1' }),
}));

vi.mock('../hooks/useOrgTier', () => ({
  useOrgTier: () => 'free',
  tierCovers: (tier: string, required: string) => {
    if (tier === 'unknown') return null;
    if (tier === 'enterprise') return true;
    if (tier === 'payg') return required !== 'enterprise';
    return required === 'free';
  },
}));

vi.mock('../hooks/useGroupedModels', () => ({
  useGroupedModels: () => ({
    data: fixture(),
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useModelToggles: () => ({ mutate: mutateMock, isPending: false }),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

function caps(over: Record<string, boolean> = {}) {
  return { tools: false, vision: false, reasoning: false, structured_output: false, ...over };
}

function fixture(): GroupedModels {
  return {
    platform: [
      {
        provider: 'openai',
        provider_display_name: 'OpenAI',
        models: [
          {
            model_id: 'gpt-4o',
            display_name: 'GPT-4o',
            required_product: 'free',
            required_product_label: 'Free',
            enabled: true,
            usable: true,
            reasons: [],
            capabilities: caps({ tools: true, vision: true }),
            pricing: { input_per_1m: '2.50', output_per_1m: '10.00' },
            pinned_by: [],
          },
          {
            model_id: 'gpt-4o-mini',
            display_name: 'GPT-4o Mini',
            required_product: 'free',
            required_product_label: 'Free',
            enabled: false,
            usable: true,
            reasons: [],
            capabilities: caps({ tools: true }),
            pinned_by: [],
          },
        ],
      },
      {
        provider: 'anthropic',
        provider_display_name: 'Anthropic',
        models: [
          {
            model_id: 'claude-3-7-sonnet',
            display_name: 'Claude 3.7 Sonnet',
            required_product: 'payg',
            required_product_label: 'Pay-as-you-go',
            enabled: false,
            usable: true,
            reasons: [],
            capabilities: caps({ tools: true, reasoning: true }),
            pricing: { input_per_1m: '3.00', output_per_1m: '15.00' },
            pinned_by: [],
          },
        ],
      },
      {
        provider: 'xai',
        provider_display_name: 'xAI',
        models: [
          {
            model_id: 'grok-reasoner',
            display_name: 'Grok Reasoner',
            required_product: 'enterprise',
            required_product_label: 'Enterprise',
            enabled: false,
            usable: false,
            reasons: ['provider_credential_missing'],
            capabilities: caps({ reasoning: true }),
            pinned_by: [],
          },
        ],
      },
    ],
    byok: [
      {
        provider: 'openai',
        provider_display_name: 'OpenAI',
        credential_id: 'cred-1',
        credential_label: 'Production Key',
        credential_fingerprint: 'sk-…8f9a',
        models: [
          {
            model_id: 'gpt-4o',
            display_name: 'GPT-4o',
            required_product: 'free',
            required_product_label: 'Free',
            enabled: true,
            usable: true,
            reasons: [],
            capabilities: caps({ tools: true, vision: true }),
            pinned_by: [{ assistant_id: 'a-1', version: 3 }],
          },
          {
            model_id: 'llama-3.3-70b-instruct',
            display_name: 'Llama 3.3 70B Instruct',
            required_product: 'enterprise',
            required_product_label: 'Enterprise',
            enabled: true,
            usable: true,
            reasons: [],
            capabilities: caps({ tools: true }),
            pricing: { input_per_1m: '0.35', output_per_1m: '0.4' },
            pricing_source: 'operator_declared',
            pinned_by: [],
          },
        ],
      },
    ],
  };
}

function renderTab() {
  return render(
    <ThemeProvider theme={theme}>
      <TabModels />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  mutateMock.mockReset();
});

describe('TabModels', () => {
  it('renders both supergroups; the same model from both sources is two distinct rows', () => {
    renderTab();
    // 'Platform Managed' appears as both the section badge and the panel title.
    expect(screen.getAllByText('Platform Managed')).toHaveLength(2);
    // BYOK badge is the short label; the panel carries the full title.
    expect(screen.getByText('BYOK & Custom')).toBeTruthy();
    expect(screen.getByText('BYOK & Custom Endpoints')).toBeTruthy();
    // BYOK group header: key label + fingerprint.
    expect(screen.getByText('OpenAI — Production Key')).toBeTruthy();
    expect(screen.getByText('sk-…8f9a')).toBeTruthy();
    // Same model id, two distinct rows — one per supergroup.
    expect(screen.getAllByText('GPT-4o')).toHaveLength(2);
    expect(screen.getByRole('switch', { name: /GPT-4o \(platform\)/ })).toBeTruthy();
    expect(screen.getByRole('switch', { name: /GPT-4o \(BYOK Production Key\)/ })).toBeTruthy();
  });

  it('renders capability, price, and tier badges on a model row', () => {
    renderTab();
    expect(screen.getByText('$2.50 / $10.00 per 1M tokens')).toBeTruthy();
    expect(screen.getByText('Pay-as-you-go')).toBeTruthy();
    // Tool-less rows get the amber incompatibility badge.
    expect(screen.getByText('Incompatible: no tool support')).toBeTruthy();
  });

  it('PRV-035: operator-declared prices are labeled, never presented as catalog prices', () => {
    renderTab();
    expect(
      screen.getByText('$0.35 / $0.4 per 1M tokens (operator-declared)'),
    ).toBeTruthy();
  });

  it('tier-gates honestly: disabled switch + tooltip + Upgrade CTA, never hidden', async () => {
    renderTab();
    // Grok Reasoner requires enterprise; the org is free. The kit's Switch
    // expresses disabled via aria-disabled + tabindex -1 (no native disabled).
    const grokSwitch = screen.getByRole('switch', { name: /Grok Reasoner/ });
    expect(grokSwitch).toHaveAttribute('aria-disabled', 'true');
    // The row is still fully visible (no hiding).
    expect(screen.getByText('Grok Reasoner')).toBeTruthy();

    fireEvent.mouseEnter(grokSwitch);
    await waitFor(
      () => {
        expect(screen.getByRole('tooltip').textContent).toContain(
          'Requires Enterprise plan to enable',
        );
      },
      { timeout: 3000 },
    );

    expect(screen.getByRole('link', { name: /Upgrade plan to enable Grok Reasoner/ })).toBeTruthy();

    // A free-tier model on a free org stays interactive.
    expect(screen.getByRole('switch', { name: /GPT-4o \(platform\)/ })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('shows usable=false reasons as human text', () => {
    renderTab();
    expect(
      screen.getByText('No verified provider credential is attached — connect a key before enabling.'),
    ).toBeTruthy();
  });

  it('posts the exact N-6 payload when toggling a model on (platform: no credential_id)', () => {
    renderTab();
    fireEvent.click(screen.getByRole('switch', { name: /GPT-4o Mini \(platform\)/ }));
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0]).toEqual([
      {
        supergroup: 'platform',
        provider: 'openai',
        model_id: 'gpt-4o-mini',
        credential_id: undefined,
        enabled: true,
      },
    ]);
  });

  it('requires the blast-radius confirm before toggling off a pinned model', () => {
    renderTab();
    fireEvent.click(screen.getByRole('switch', { name: /GPT-4o \(BYOK Production Key\)/ }));

    // The confirm lists the affected assistant (ID — the engine N-5 payload
    // carries no display name) + version and states the invariant.
    expect(screen.getByRole('dialog').textContent).toContain('a-1');
    expect(screen.getByText('v3')).toBeTruthy();
    expect(screen.getByRole('dialog').textContent).toContain('Pinning invariant');

    // Cancel aborts: no write.
    fireEvent.click(screen.getByRole('button', { name: 'Keep enabled' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(mutateMock).not.toHaveBeenCalled();

    // Confirm posts the toggle with the BYOK credential id.
    fireEvent.click(screen.getByRole('switch', { name: /GPT-4o \(BYOK Production Key\)/ }));
    fireEvent.click(screen.getByRole('button', { name: /Disable GPT-4o/ }));
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0]).toEqual([
      {
        supergroup: 'byok',
        provider: 'openai',
        model_id: 'gpt-4o',
        credential_id: 'cred-1',
        enabled: false,
      },
    ]);
  });

  it('renders reasoning presets as display-only with honest per-assistant copy', () => {
    const { container } = renderTab();
    // Two reasoning-capable models in the fixture (Claude + Grok) — open the first.
    const presetButtons = screen.getAllByRole('button', { name: 'Reasoning presets' });
    expect(presetButtons).toHaveLength(2);
    fireEvent.click(presetButtons[0]);
    expect(screen.getByText('Fast')).toBeTruthy();
    expect(screen.getByText('Standard')).toBeTruthy();
    expect(screen.getByText('Deep reasoning')).toBeTruthy();
    expect(screen.getByText(/Thinking budget range: 1,000 – 32,000 tokens/)).toBeTruthy();
    expect(screen.getByText(/no engine field for an org-wide reasoning default/)).toBeTruthy();
    // No invented write path: no slider or input that could pretend to persist.
    expect(container.querySelector('input[type="range"]')).toBeNull();
  });
});
