// @vitest-environment jsdom
/**
 * ModelsPage — targeted coverage (ported from the retired TabModels suite):
 * - Both supergroups render as dense tables; the same model id from
 *   Platform Managed AND a BYOK key is two distinct rows.
 * - Tier gating: models above the org tier keep the full row visible with a
 *   disabled switch + explanatory tooltip + Upgrade CTA (never hidden).
 * - usable=false rows show reasons[] as human text.
 * - Toggle-OFF of a pinned_by non-empty model goes through the
 *   blast-radius confirm (cancel aborts, confirm posts the toggle).
 * - Toggle posts the exact N-6 payload (credential_id undefined for
 *   platform, the key UUID for BYOK).
 * - Reasoning presets render display-only with honest "per-assistant in the
 *   builder" copy — no invented write path.
 * - Search narrows the tables; the counts line stays honest.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { ModelsPage } from './ModelsPage';
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
  CAPABILITY_LABELS: {
    tools: 'Tools',
    vision: 'Vision',
    reasoning: 'Reasoning',
    structured_output: 'Structured output',
  },
  humanizeReason: (r: string) => r.replace(/_/g, ' '),
  rowKey: (sg: string, g: { provider: string }, m: { model_id: string }) =>
    `${sg}:${g.provider}:${m.model_id}`,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
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
          {
            // Stale stored flag: enabled=true while the engine says
            // unusable — the switch must still render OFF (W1 invariant).
            model_id: 'grok-heavy',
            display_name: 'Grok Heavy',
            required_product: 'enterprise',
            required_product_label: 'Enterprise',
            enabled: true,
            usable: false,
            reasons: ['subscription_required'],
            capabilities: caps({ tools: true }),
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

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <ModelsPage />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  mutateMock.mockReset();
});

describe('ModelsPage', () => {
  it('renders both supergroups; the same model from both sources is two distinct rows', () => {
    renderPage();
    expect(screen.getByText('Platform Managed')).toBeTruthy();
    expect(screen.getByText('BYOK · your keys')).toBeTruthy();
    // BYOK credential sub-header: key label + fingerprint.
    expect(screen.getByRole('heading', { name: /BYOK · Production Key/ })).toBeTruthy();
    expect(screen.getByText('sk-…8f9a')).toBeTruthy();
    // Same model id, two distinct rows — one per supergroup.
    expect(screen.getAllByText('GPT-4o')).toHaveLength(2);
    expect(screen.getByRole('switch', { name: /GPT-4o \(platform\)/ })).toBeTruthy();
    expect(screen.getByRole('switch', { name: /GPT-4o \(BYOK Production Key\)/ })).toBeTruthy();
    // Counts line is honest.
    expect(screen.getByText('7 of 7 models · 3 enabled')).toBeTruthy();
  });

  it('renders the table columns: capabilities, context, input/output, tier, used-by', () => {
    renderPage();
    expect(screen.getAllByText('Capabilities').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Context').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Input / 1M').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Used by').length).toBeGreaterThan(0);
    // Priced platform row shows input + output cells.
    expect(screen.getByText('$2.50')).toBeTruthy();
    expect(screen.getByText('$10.00')).toBeTruthy();
    expect(screen.getByText('Pay-as-you-go')).toBeTruthy();
    // Tool-less rows get the honest tag.
    expect(screen.getByText('No tools')).toBeTruthy();
    // Pinned model shows its assistant count.
    expect(screen.getByText('1 assistant')).toBeTruthy();
    // The SVG's DEFAULT column has no backing concept — it must not render.
    expect(screen.queryByText('Default')).toBeNull();
  });

  it('PRV-035: operator-declared prices are labeled, never presented as catalog prices', () => {
    renderPage();
    expect(screen.getByText('$0.35')).toBeTruthy();
    expect(screen.getAllByText('operator').length).toBeGreaterThan(0);
    // BYOK rows without pricing show "Direct" (input + output), never an invented zero.
    expect(screen.getAllByText('Direct')).toHaveLength(2);
  });

  it('tier-gates honestly: disabled switch + tooltip + Upgrade CTA, never hidden', async () => {
    renderPage();
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

    expect(screen.getAllByRole('link', { name: 'Upgrade →' }).length).toBeGreaterThan(0);

    // A free-tier model on a free org stays interactive.
    expect(screen.getByRole('switch', { name: /GPT-4o \(platform\)/ })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('shows usable=false reasons as human text', () => {
    renderPage();
    expect(screen.getByText('provider credential missing')).toBeTruthy();
  });

  it('never renders the switch ON alongside a cannot-enable warning (stale enabled flag)', () => {
    renderPage();
    // Grok Heavy: stored enabled=true, but the engine reports usable=false.
    const sw = screen.getByRole('switch', { name: /Grok Heavy/ });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(sw).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('subscription required')).toBeTruthy();
    // Enable label, never "Disable", when unusable.
    expect(sw.getAttribute('aria-label')).toMatch(/^Enable Grok Heavy/);
  });

  it('posts the exact N-6 payload when toggling a model on (platform: no credential_id)', () => {
    renderPage();
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
    renderPage();
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
    const { container } = renderPage();
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

  it('search narrows the tables and the counts line follows', () => {
    renderPage();
    const search = screen.getByLabelText('Search models');
    fireEvent.change(search, { target: { value: 'claude' } });
    expect(screen.getByText('Claude 3.7 Sonnet')).toBeTruthy();
    expect(screen.queryByText('Grok Reasoner')).toBeNull();
    expect(screen.getByText('1 of 7 models · 0 enabled')).toBeTruthy();
  });

  it('renders the footer copy from the reference', () => {
    renderPage();
    expect(screen.getByText(/Toggles apply immediately/)).toBeTruthy();
    expect(screen.getByText(/disabled models fail closed at publish and run time/)).toBeTruthy();
  });
});
