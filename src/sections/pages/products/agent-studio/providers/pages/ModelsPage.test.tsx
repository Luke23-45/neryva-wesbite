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
import { fireEvent, render, screen, waitFor, within, cleanup } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import toast from 'react-hot-toast';
import { ModelsPage } from './ModelsPage';
import type { GroupedModels } from '../hooks/useGroupedModels';

const mutateMock = vi.hoisted(() => vi.fn());
const defaultMutateMock = vi.hoisted(() => vi.fn());
// Mutable grouped-models payload for tests that need a different fixture
// than the default (vi.hoisted: the mock factory runs before module body).
const fixtureOverrideRef = vi.hoisted(() => ({ current: null as GroupedModels | null }));
// Mutable N-4 directory rows for provider-level gate tests (can_enable).
const directoryOverrideRef = vi.hoisted(
  () =>
    ({ current: null }) as {
      current: Array<{
        provider: string;
        can_enable?: boolean;
        connection?: { enabled: boolean; stored_enabled?: boolean };
      }> | null;
    },
);
// Mutable org role for role-gating tests (default: owner — fully privileged).
const roleOverrideRef = vi.hoisted(() => ({ current: null as string | null }));
// Mutable BYOK fee for the per-row fee disclosure tests (null = fee config
// not loaded → the suffix is omitted, never invented).
const feeOverrideRef = vi.hoisted(() => ({ current: 2 as number | null }));
// Observable refetch for degraded-lane retry tests.
const refetchMockRef = vi.hoisted(() => ({ current: vi.fn() }));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-1', role: roleOverrideRef.current ?? 'owner' }),
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
    data: fixtureOverrideRef.current ?? fixture(),
    isPending: false,
    isError: false,
    refetch: refetchMockRef.current,
  }),
  useModelToggles: () => ({ mutate: mutateMock, isPending: false }),
  useModelDefault: () => ({ mutate: defaultMutateMock, isPending: false }),
  formatContextTokens: (n: number | null | undefined) =>
    n === null || n === undefined ? '—' : n >= 1_000_000 ? `${n / 1_000_000}M` : `${n / 1_000}K`,
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

vi.mock('../hooks/useSpend', () => ({
  useSpendSummary: () => ({
    data:
      feeOverrideRef.current === null
        ? null
        : { fee_config: { byok_fee_credits_per_call: feeOverrideRef.current } },
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('../hooks/useProviderDirectory', () => ({
  useProviderDirectory: () => ({
    data: { providers: directoryOverrideRef.current ?? [] },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
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
            context_window_tokens: 128000,
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
            context_window_tokens: 128000,
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
            context_window_tokens: 200000,
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
            context_window_tokens: null,
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
            context_window_tokens: 1000000,
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
            context_window_tokens: 128000,
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
            context_window_tokens: null,
            pinned_by: [],
          },
        ],
      },
    ],
    default_model: { provider: 'openai', model_id: 'gpt-4o' },
    degraded: [],
  };
}

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <ModelsPage />
    </ThemeProvider>,
  );
}

/**
 * Fixture with one 8-model provider group (empty BYOK) for the
 * expand/collapse tests. Models are cloned from the base row template so
 * the row shape stays identical to production rows.
 */
function bigGroupFixture(): GroupedModels {
  const f = fixture();
  const template = f.platform[0].models[0];
  const models = Array.from({ length: 8 }, (_, i) => ({
    ...template,
    model_id: `gpt-x${i + 1}`,
    display_name: `GPT X${i + 1}`,
  }));
  return {
    ...f,
    platform: [{ provider: 'openai', provider_display_name: 'OpenAI', models }],
    byok: [],
  };
}

beforeEach(() => {
  mutateMock.mockReset();
  defaultMutateMock.mockReset();
  vi.mocked(toast.error).mockReset();
  fixtureOverrideRef.current = null;
  directoryOverrideRef.current = null;
  roleOverrideRef.current = null;
  feeOverrideRef.current = 2;
  refetchMockRef.current.mockReset();
});

describe('ModelsPage', () => {
  it('renders both supergroups; the same model from both sources is two distinct rows', () => {
    renderPage();
    expect(screen.getByText('Platform Managed')).toBeTruthy();
    expect(screen.getByText('BYOK · your keys')).toBeTruthy();
    // BYOK credential sub-header: key label + fingerprint.
    expect(screen.getByRole('heading', { name: /BYOK · Production Key/ })).toBeTruthy();
    expect(screen.getByText('sk-…8f9a')).toBeTruthy();
    // Same model id, two distinct rows — one per supergroup. (Scoped to the
    // tables: the DefaultBar also displays the current default's name.)
    const tables = screen.getAllByRole('table');
    const rowNames = tables.flatMap((t) => within(t).queryAllByText('GPT-4o'));
    expect(rowNames).toHaveLength(2);
    expect(screen.getByRole('switch', { name: /GPT-4o \(platform\)/ })).toBeTruthy();
    expect(screen.getByRole('switch', { name: /GPT-4o \(BYOK Production Key\)/ })).toBeTruthy();
    // Counts line is honest.
    expect(screen.getByText('7 of 7 models · 3 enabled')).toBeTruthy();
  });

  it('renders the table columns: capabilities, input/output, used-by, default (no tier column)', () => {
    renderPage();
    expect(screen.getAllByText('Capabilities').length).toBeGreaterThan(0);
    expect(screen.queryByText('Context')).toBeNull();
    expect(screen.getAllByText('Input / 1M').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Used by').length).toBeGreaterThan(0);
    // The SVG's DEFAULT column is backed now — it renders between Used by and Access.
    expect(screen.getAllByText('Default').length).toBeGreaterThan(0);
    // Priced platform row shows input + output cells.
    expect(screen.getByText('$2.50')).toBeTruthy();
    expect(screen.getByText('$10.00')).toBeTruthy();
    // The Tier column was dropped from the models list.
    expect(screen.queryByText('Tier')).toBeNull();
    // Tool-less rows get the honest tag.
    expect(screen.getByText('No tools')).toBeTruthy();
    // Pinned model shows its assistant count; unpinned rows show "0 assistants".
    expect(screen.getByText('1 assistant')).toBeTruthy();
    expect(screen.getAllByText('0 assistants').length).toBe(6);
  });

  it('renders one table per section with provider header rows; small groups show no expand control', () => {
    const { container } = renderPage();
    // Single thead per section: one platform table + one BYOK table.
    expect(screen.getAllByText('Input / 1M')).toHaveLength(2);
    // Platform groups each open with a full-width header row
    // ("{display_name} · {n} models"); all fixture groups have ≤5 models,
    // so no Show-all control renders.
    expect(screen.getByText('OpenAI')).toBeTruthy();
    expect(screen.getByText('Anthropic')).toBeTruthy();
    expect(screen.getByText('xAI')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Show all/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show less' })).toBeNull();
    // 3 platform header rows + 5 platform model rows + 2 BYOK model rows.
    expect(container.querySelectorAll('tbody tr')).toHaveLength(10);
    // Provider identity still lives on every row: avatar initial + second line.
    // The BYOK row additionally discloses the per-call platform fee.
    expect(screen.getByText('openai · gpt-4o · 128K')).toBeTruthy();
    expect(
      screen.getByText('openai · gpt-4o · 128K · billed by OpenAI + 2 credits/call'),
    ).toBeTruthy();
    expect(screen.getByText('anthropic · claude-3-7-sonnet · 200K')).toBeTruthy();
  });

  it('shows context in the model sub-line; "—" when the catalog has no value', () => {
    renderPage();
    expect(screen.getByText('openai · gpt-4o · 128K')).toBeTruthy();
    // The BYOK duplicate additionally discloses the per-call platform fee.
    expect(
      screen.getByText('openai · gpt-4o · 128K · billed by OpenAI + 2 credits/call'),
    ).toBeTruthy();
    expect(screen.getByText('anthropic · claude-3-7-sonnet · 200K')).toBeTruthy();
    expect(screen.getByText('xai · grok-heavy · 1M')).toBeTruthy();
    // Unknown context is honest, never invented.
    expect(screen.getByText('xai · grok-reasoner · —')).toBeTruthy();
  });

  it('checks exactly one DEFAULT radio — the platform row wins over the BYOK duplicate', () => {
    renderPage();
    const radios = screen.getAllByRole('radio', {
      name: 'Set GPT-4o as the default model for new assistants',
    });
    expect(radios).toHaveLength(2);
    // DOM order is render order: platform table first.
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
    expect((radios[1] as HTMLInputElement).checked).toBe(false);
    // No other row is checked.
    const allRadios = screen.getAllByRole('radio');
    expect(allRadios.filter((r) => (r as HTMLInputElement).checked)).toHaveLength(1);
  });

  it('selecting a DEFAULT radio PUTs provider+model_id (no credential in the payload)', () => {
    renderPage();
    const radios = screen.getAllByRole('radio', {
      name: 'Set GPT-4o as the default model for new assistants',
    });
    fireEvent.click(radios[1]);
    expect(defaultMutateMock).toHaveBeenCalledTimes(1);
    expect(defaultMutateMock.mock.calls[0][0]).toEqual({
      provider: 'openai',
      model_id: 'gpt-4o',
    });
  });

  it('a 422 from the default PUT toasts honestly (no invented success)', () => {
    renderPage();
    defaultMutateMock.mockImplementationOnce((_def, opts?: { onError?: (e: unknown) => void }) =>
      opts?.onError?.({ status: 422 }),
    );
    const radios = screen.getAllByRole('radio', {
      name: 'Set GPT-4o as the default model for new assistants',
    });
    fireEvent.click(radios[1]);
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "That model isn't available for your organization — the default was not changed.",
    );
  });

  it('tie-break: an unusable platform row yields the checked radio to the usable BYOK row', () => {
    const f = fixture();
    fixtureOverrideRef.current = {
      ...f,
      platform: f.platform.map((g) =>
        g.provider === 'openai'
          ? {
              ...g,
              models: g.models.map((m) =>
                m.model_id === 'gpt-4o'
                  ? { ...m, enabled: false, usable: false, reasons: ['model_disabled_by_org'] }
                  : m,
              ),
            }
          : g,
      ),
    };
    renderPage();

    // The platform row can't serve: disabled radio, never checked.
    const platformRadio = screen.getByRole('radio', {
      name: 'GPT-4o cannot be the default model',
    });
    expect(platformRadio).toBeDisabled();
    expect((platformRadio as HTMLInputElement).checked).toBe(false);

    // The usable BYOK row carries the single checked radio.
    const byokRadios = screen.getAllByRole('radio', {
      name: 'Set GPT-4o as the default model for new assistants',
    });
    expect(byokRadios).toHaveLength(1);
    expect(byokRadios[0]).not.toBeDisabled();
    expect((byokRadios[0] as HTMLInputElement).checked).toBe(true);

    const allRadios = screen.getAllByRole('radio');
    expect(allRadios.filter((r) => (r as HTMLInputElement).checked)).toHaveLength(1);
  });

  it('disables the DEFAULT radio for models that cannot serve as default', () => {
    renderPage();
    const grokRadio = screen.getByRole('radio', {
      name: 'Grok Reasoner cannot be the default model',
    });
    expect(grokRadio).toBeDisabled();
    // A disabled-by-toggle (not enabled) row is disabled too.
    const miniRadio = screen.getByRole('radio', {
      name: 'GPT-4o Mini cannot be the default model',
    });
    expect(miniRadio).toBeDisabled();
  });

  it('PRV-035: operator-declared prices are labeled, never presented as catalog prices', () => {
    renderPage();
    expect(screen.getByText('$0.35')).toBeTruthy();
    expect(screen.getAllByText('operator').length).toBeGreaterThan(0);
    // BYOK rows without pricing show "Direct" (input + output), never an invented zero.
    expect(screen.getAllByText('Direct')).toHaveLength(2);
  });

  it('tier-gates honestly: disabled switch + tooltip, no billing link, never hidden', async () => {
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

    // No billing links anywhere in the table — tooltips carry reasons.
    expect(screen.queryByRole('link', { name: 'Upgrade →' })).toBeNull();

    // A free-tier model on a free org stays interactive.
    expect(screen.getByRole('switch', { name: /GPT-4o \(platform\)/ })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('provider can_enable=false gates model toggles with no billing link; rows never hide', async () => {
    // GPT-4o Mini is free-tier and OFF: the client tier logic alone would
    // leave it interactive on a free org — the provider-level server gate
    // disables it instead.
    directoryOverrideRef.current = [{ provider: 'openai', can_enable: false }];
    renderPage();
    const sw = screen.getByRole('switch', { name: /GPT-4o Mini \(platform\)/ });
    expect(sw).toHaveAttribute('aria-disabled', 'true');
    // The row is still fully visible (no hiding); the tooltip carries the
    // reason, and no billing link renders in the table.
    expect(screen.getByText('GPT-4o Mini')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Upgrade →' })).toBeNull();
    // The tooltip uses plan-honest copy: can_enable=false is a plan gate
    // (engine: tierGte), never a credit gate.
    fireEvent.mouseEnter(sw);
    await waitFor(
      () => {
        expect(screen.getByRole('tooltip').textContent).toContain(
          'Your plan doesn\u2019t cover this provider',
        );
      },
      { timeout: 3000 },
    );
    // The disabled switch cannot fire the toggle API.
    fireEvent.click(sw);
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('provider can_enable=false on an enabled model keeps the switch interactive for turning off', () => {
    directoryOverrideRef.current = [{ provider: 'openai', can_enable: false }];
    renderPage();
    // GPT-4o is enabled in the fixture: grandfathered ON stays interactive
    // so the org can always turn it OFF (disabling is never plan-gated).
    const sw = screen.getByRole('switch', { name: /GPT-4o \(platform\)/ });
    expect(sw).not.toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(sw);
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0][0]).toMatchObject({ enabled: false });
  });

  it('a 402 provider_tier_required on a model toggle toasts the plan-honest nudge, never the raw error', () => {
    renderPage();
    const sw = screen.getByRole('switch', { name: /GPT-4o Mini \(platform\)/ });
    fireEvent.click(sw);
    expect(mutateMock).toHaveBeenCalledTimes(1);
    const onError = mutateMock.mock.calls[0][1].onError as (err: unknown) => void;
    onError({ status: 402, code: 'provider_tier_required', message: 'plan required' });
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      'Your plan doesn\u2019t cover this provider \u2014 upgrade to enable it.',
    );
  });

  it('capability badges render all four capabilities as plain labels, no dots', () => {
    renderPage();
    // The dots were removed per owner direction: badges are plain text
    // labels (secondary when present, faint when absent), with no dot
    // element inside.
    // GPT-4o (platform) has tools+vision; reasoning+structured_output are
    // absent — all four badges still render, each with no dot child.
    const gptSwitch = screen.getByRole('switch', { name: /GPT-4o \(platform\)/ });
    const gptRow = gptSwitch.closest('tr') as HTMLElement;
    for (const label of ['Tools', 'Vision', 'Reasoning', 'Structured output']) {
      const badge = within(gptRow).getByText(label);
      expect(badge.querySelector('span[aria-hidden="true"]')).toBeNull();
    }
  });

  it('BYOK rows disclose the per-call platform fee from engine fee_config on the second line', () => {
    renderPage();
    const byokSwitch = screen.getByRole('switch', { name: /GPT-4o \(BYOK/ });
    const byokRow = byokSwitch.closest('tr') as HTMLElement;
    const subLine = within(byokRow).getByText(/billed by OpenAI/);
    // Engine truth is a flat per-call credit fee — never the SVG's stale
    // percentage, never invented.
    expect(subLine.textContent).toContain(
      'openai · gpt-4o · 128K · billed by OpenAI + 2 credits/call',
    );
    // Platform rows carry no fee suffix.
    const platformSwitch = screen.getByRole('switch', { name: /GPT-4o \(platform\)/ });
    const platformRow = platformSwitch.closest('tr') as HTMLElement;
    expect(within(platformRow).queryByText(/billed by/)).toBeNull();
  });

  it('omits the fee suffix when the fee config has not loaded — never invents it', () => {
    feeOverrideRef.current = null;
    renderPage();
    const byokSwitch = screen.getByRole('switch', { name: /GPT-4o \(BYOK/ });
    const byokRow = byokSwitch.closest('tr') as HTMLElement;
    expect(within(byokRow).queryByText(/billed by/)).toBeNull();
    expect(within(byokRow).getByText('openai · gpt-4o · 128K')).toBeTruthy();
  });

  it('a null provider display name renders the avatar fallback instead of crashing', () => {
    const f = fixture();
    f.platform[0].provider_display_name = null as unknown as string;
    fixtureOverrideRef.current = f;
    renderPage();
    // The page renders (client search must never 500 the page) and the
    // avatar falls back to '?'.
    expect(screen.getByRole('switch', { name: /GPT-4o \(platform\)/ })).toBeTruthy();
  });

  it('a null model display name or id degrades search to "" instead of crashing', () => {
    const f = fixture();
    f.platform[0].models[0].display_name = null as unknown as string;
    f.platform[0].models[0].model_id = null as unknown as string;
    fixtureOverrideRef.current = f;
    renderPage();
    // matches() touches model fields only when a query is active.
    fireEvent.change(screen.getByLabelText('Search models'), {
      target: { value: 'anthropic' },
    });
    // The page renders — client search must never 500 the page.
    expect(screen.getByText(/Claude 3.7 Sonnet/)).toBeTruthy();
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
    // The enabled count is org state, not search state: it derives from the
    // FULL groups, so the search never rewrites it.
    expect(screen.getByText('1 of 7 models · 3 enabled')).toBeTruthy();
  });

  it('renders the footer copy from the reference', () => {
    renderPage();
    expect(screen.getByText(/Toggles apply immediately/)).toBeTruthy();
    expect(screen.getByText(/disabled models fail closed at publish and run time/)).toBeTruthy();
    expect(screen.getByText(/the default applies to new assistants/)).toBeTruthy();
  });

  it('reader role: radios and switches are disabled with an honest hint', () => {
    roleOverrideRef.current = 'reader';
    renderPage();
    expect(
      screen.getByText('Only owners, admins and developers can change models.'),
    ).toBeTruthy();
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(0);
    for (const r of radios) expect(r).toBeDisabled();
    expect(screen.getByRole('switch', { name: /GPT-4o \(platform\)/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    // No write can fire.
    fireEvent.click(screen.getByRole('switch', { name: /GPT-4o Mini \(platform\)/ }));
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('billing role cannot change models either — rank equality with developer does not grant writes', () => {
    roleOverrideRef.current = 'billing';
    renderPage();
    expect(
      screen.getByText('Only owners, admins and developers can change models.'),
    ).toBeTruthy();
    expect(screen.getByRole('switch', { name: /GPT-4o \(platform\)/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('developer role keeps full write access', () => {
    roleOverrideRef.current = 'developer';
    renderPage();
    expect(
      screen.queryByText('Only owners, admins and developers can change models.'),
    ).toBeNull();
    expect(screen.getByRole('switch', { name: /GPT-4o \(platform\)/ })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('clear default sends null to the engine', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Clear default' }));
    expect(defaultMutateMock).toHaveBeenCalledTimes(1);
    expect(defaultMutateMock.mock.calls[0][0]).toBeNull();
  });

  it('a failed clear toasts honestly without leaking machine details', () => {
    renderPage();
    defaultMutateMock.mockImplementationOnce(
      (_def: unknown, opts?: { onError?: (e: unknown) => void }) =>
        opts?.onError?.({ status: 500, code: 'internal', message: 'db exploded' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear default' }));
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      'Could not clear the default model — your previous default was restored.',
    );
    // No [status code]: message leak in the user copy.
    for (const call of vi.mocked(toast.error).mock.calls) {
      expect(String(call[0])).not.toContain('db exploded');
      expect(String(call[0])).not.toMatch(/\[\d+ /);
    }
  });

  it('a dangling stored default renders the honest unavailable state, never a silent unchecked radio', () => {
    const f = fixture();
    fixtureOverrideRef.current = {
      ...f,
      default_model: { provider: 'openai', model_id: 'ghost-model' },
    };
    renderPage();
    expect(screen.getByText(/Model unavailable — no longer offered/)).toBeTruthy();
    expect(screen.getByText(/openai \/ ghost-model/)).toBeTruthy();
    // No radio claims the default.
    const allRadios = screen.getAllByRole('radio');
    expect(allRadios.filter((r) => (r as HTMLInputElement).checked)).toHaveLength(0);
  });

  it('a default hidden by search keeps its indication via the honest note', () => {
    renderPage();
    const search = screen.getByLabelText('Search models');
    fireEvent.change(search, { target: { value: 'claude' } });
    // The checked radio still resolves from the FULL groups even though no
    // defaultable row is visible.
    expect(screen.getByText('The default model is hidden by the current search.')).toBeTruthy();
    expect(screen.getByText('GPT-4o')).toBeTruthy();
  });

  it('search matches provider names too', () => {
    renderPage();
    const search = screen.getByLabelText('Search models');
    fireEvent.change(search, { target: { value: 'anthropic' } });
    expect(screen.getByText('Claude 3.7 Sonnet')).toBeTruthy();
    expect(screen.queryByText('Grok Reasoner')).toBeNull();
  });

  it('each degraded lane renders an honest note with a working retry', () => {
    const f = fixture();
    fixtureOverrideRef.current = {
      ...f,
      degraded: [
        'model_toggles',
        'provider_enablements',
        'credentials',
        'provider_facts',
        'cost_points',
        'model_pins',
      ],
    };
    renderPage();
    expect(
      screen.getByText(/Could not load your saved toggles/),
    ).toBeTruthy();
    expect(
      screen.getByText(/Could not load provider enablement/),
    ).toBeTruthy();
    expect(
      screen.getByText(/Could not load your connected credentials — the BYOK section may be incomplete/),
    ).toBeTruthy();
    expect(screen.getByText(/Could not verify provider status/)).toBeTruthy();
    expect(screen.getByText(/Could not load pricing/)).toBeTruthy();
    expect(screen.getByText(/Could not load usage information/)).toBeTruthy();
    // Every lane's retry refetches the grouped query.
    const retries = screen.getAllByRole('button', { name: 'Retry' });
    expect(retries.length).toBeGreaterThanOrEqual(6);
    fireEvent.click(retries[0]);
    expect(refetchMockRef.current).toHaveBeenCalledTimes(1);
  });

  it('an unknown default model offers retry instead of a dead end', () => {
    const f = fixture();
    fixtureOverrideRef.current = { ...f, degraded: ['default_model'] };
    renderPage();
    expect(screen.getByText('Could not load the default model.')).toBeTruthy();
    const retry = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retry);
    expect(refetchMockRef.current).toHaveBeenCalledTimes(1);
    // No Clear affordance while the default is unknown — nothing to clear.
    expect(screen.queryByRole('button', { name: 'Clear default' })).toBeNull();
  });

  it('the BYOK CTA adapts to whether credentials exist', () => {
    // Non-empty BYOK: the persistent CTA invites connecting another key.
    renderPage();
    expect(
      screen.getByRole('link', { name: /Connect another key in My Providers/ }),
    ).toBeTruthy();
    expect(screen.queryByText(/No other connected credentials/)).toBeNull();

    // Empty BYOK: the honest empty copy stays.
    cleanup();
    const f = fixture();
    fixtureOverrideRef.current = { ...f, byok: [] };
    renderPage();
    expect(
      screen.getByRole('link', { name: /No other connected credentials/ }),
    ).toBeTruthy();
    expect(screen.queryByText(/Connect another key/)).toBeNull();
  });

  it('a failed toggle logs machine details and toasts user-safe copy', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      renderPage();
      mutateMock.mockImplementationOnce(
        (_toggles: unknown, opts?: { onError?: (e: unknown) => void }) =>
          opts?.onError?.({ status: 500, code: 'internal', message: 'db exploded' }),
      );
      fireEvent.click(screen.getByRole('switch', { name: /GPT-4o Mini \(platform\)/ }));
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'Could not save the model toggle — your previous settings were restored.',
      );
      // Machine details are logged, never toasted.
      expect(errSpy).toHaveBeenCalledWith(
        '[models] toggle POST failed',
        expect.objectContaining({ message: 'db exploded' }),
      );
      for (const call of vi.mocked(toast.error).mock.calls) {
        expect(String(call[0])).not.toContain('db exploded');
      }
    } finally {
      errSpy.mockRestore();
    }
  });

  describe('provider group expand/collapse', () => {
    it('collapses groups larger than 5 models behind a Show-all control', () => {
      fixtureOverrideRef.current = bigGroupFixture();
      renderPage();
      // The header labels the group; the control carries the honest count.
      expect(screen.getByText('OpenAI')).toBeTruthy();
      const expand = screen.getByRole('button', { name: 'Show all 8' });
      expect(expand).toHaveAttribute('aria-expanded', 'false');
      // Exactly the first 5 model rows render (one switch per row).
      const tables = screen.getAllByRole('table');
      expect(within(tables[0]).getAllByRole('switch')).toHaveLength(5);
      expect(screen.getByText('GPT X5')).toBeTruthy();
      expect(screen.queryByText('GPT X6')).toBeNull();
      // The counts line is unaffected by collapsing — a display affordance,
      // not a filter.
      expect(screen.getByText('8 of 8 models · 8 enabled')).toBeTruthy();
    });

    it('expanding reveals every row and flips the control; collapsing restores', () => {
      fixtureOverrideRef.current = bigGroupFixture();
      renderPage();
      const tables = screen.getAllByRole('table');
      fireEvent.click(screen.getByRole('button', { name: 'Show all 8' }));
      const less = screen.getByRole('button', { name: 'Show less' });
      expect(less).toHaveAttribute('aria-expanded', 'true');
      expect(within(tables[0]).getAllByRole('switch')).toHaveLength(8);
      expect(screen.getByText('GPT X8')).toBeTruthy();
      fireEvent.click(less);
      expect(screen.getByRole('button', { name: 'Show all 8' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      expect(within(tables[0]).getAllByRole('switch')).toHaveLength(5);
      expect(screen.queryByText('GPT X8')).toBeNull();
    });

    it('groups with 5 or fewer models render no expand control', () => {
      renderPage();
      expect(screen.queryByRole('button', { name: /Show all/ })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Show less' })).toBeNull();
      // All rows still render.
      expect(screen.getByText('GPT-4o Mini')).toBeTruthy();
      expect(screen.getByText('Claude 3.7 Sonnet')).toBeTruthy();
    });

    it('an active search bypasses collapsing: all matches render, no control', () => {
      fixtureOverrideRef.current = bigGroupFixture();
      renderPage();
      fireEvent.change(screen.getByLabelText('Search models'), {
        target: { value: 'gpt-x' },
      });
      const tables = screen.getAllByRole('table');
      expect(within(tables[0]).getAllByRole('switch')).toHaveLength(8);
      expect(screen.getByText('GPT X8')).toBeTruthy();
      expect(screen.queryByRole('button', { name: /Show all/ })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Show less' })).toBeNull();
    });
  });

  describe('provider-selected filter', () => {
    /**
     * Marks every row of the named providers as provider-disabled — the
     * engine's signal (resolveModelGovernance adds `provider_not_enabled`
     * alongside any other reasons on every row of a disabled provider).
     */
    function disableProviders(f: GroupedModels, ...providers: string[]): GroupedModels {
      return {
        ...f,
        platform: f.platform.map((g) =>
          providers.includes(g.provider)
            ? {
                ...g,
                models: g.models.map((m) => ({
                  ...m,
                  usable: false,
                  reasons: [...m.reasons, 'provider_not_enabled'],
                })),
              }
            : g,
        ),
      };
    }

    it('mirrors the Catalog switch: never-toggled providers stay hidden', () => {
      // No provider_not_enabled reasons anywhere — the engine's governance
      // default says enabled. The directory says only OpenAI's switch is ON;
      // Anthropic/xAI were never toggled (switch OFF). Models must mirror
      // the switches, not the governance default.
      directoryOverrideRef.current = [
        { provider: 'openai', connection: { enabled: true, stored_enabled: true } },
        { provider: 'anthropic', connection: { enabled: false, stored_enabled: false } },
        { provider: 'xai', connection: { enabled: false, stored_enabled: false } },
      ];
      renderPage();
      expect(screen.getByText('OpenAI')).toBeTruthy();
      expect(screen.queryByText('Anthropic')).toBeNull();
      expect(screen.queryByText('xAI')).toBeNull();
      expect(screen.queryByText('Claude 3.7 Sonnet')).toBeNull();
      expect(screen.queryByText('Grok Reasoner')).toBeNull();
      // 2 OpenAI + 2 BYOK rows visible.
      expect(screen.getByText('4 of 4 models · 3 enabled')).toBeTruthy();
    });

    it('falls back to connection.enabled when stored_enabled is absent (older engine)', () => {
      directoryOverrideRef.current = [
        // No stored_enabled: the switch expression falls back to enabled.
        { provider: 'openai', connection: { enabled: true } },
        { provider: 'anthropic', connection: { enabled: false } },
        { provider: 'xai', connection: { enabled: true } },
      ];
      renderPage();
      expect(screen.getByText('OpenAI')).toBeTruthy();
      expect(screen.getByText('xAI')).toBeTruthy();
      expect(screen.queryByText('Anthropic')).toBeNull();
    });

    it('providers unknown to the directory stay visible (fail open, never blank)', () => {
      // Directory loaded but knows only OpenAI — Anthropic/xAI are absent
      // (pending/failed lane, older engine). They stay visible.
      directoryOverrideRef.current = [
        { provider: 'openai', connection: { enabled: true, stored_enabled: true } },
      ];
      renderPage();
      expect(screen.getByText('OpenAI')).toBeTruthy();
      expect(screen.getByText('Anthropic')).toBeTruthy();
      expect(screen.getByText('xAI')).toBeTruthy();
      expect(screen.getByText('7 of 7 models · 3 enabled')).toBeTruthy();
    });

    it('hides a disabled provider’s group; tier-gated rows of enabled providers still render', () => {
      fixtureOverrideRef.current = disableProviders(fixture(), 'xai');
      renderPage();
      // xAI's section is gone entirely — header row and model rows.
      expect(screen.queryByText('xAI')).toBeNull();
      expect(screen.queryByText('Grok Reasoner')).toBeNull();
      expect(screen.queryByText('Grok Heavy')).toBeNull();
      // Enabled providers are untouched — including rows that are unusable
      // for OTHER reasons (tier gating never hides).
      expect(screen.getByText('OpenAI')).toBeTruthy();
      expect(screen.getByText('Anthropic')).toBeTruthy();
      // GPT-4o exists in both supergroups — both rows still render.
      // (Scoped to the tables: the DefaultBar also shows the default's name.)
      const tables = screen.getAllByRole('table');
      const rowNames = tables.flatMap((t) => within(t).getAllByText('GPT-4o'));
      expect(rowNames).toHaveLength(2);
      expect(screen.getByText('Claude 3.7 Sonnet')).toBeTruthy();
      // Counts line reflects the visible set: 3 platform + 2 BYOK.
      expect(screen.getByText('5 of 5 models · 3 enabled')).toBeTruthy();
    });

    it('all providers disabled: honest empty state pointing at Catalog', () => {
      const f = fixture();
      fixtureOverrideRef.current = {
        ...disableProviders(f, 'openai', 'anthropic', 'xai'),
        byok: [],
      };
      // The file's @tanstack/react-router mock renders <Link> as a plain
      // anchor — no router context needed.
      renderPage();
      expect(screen.getByText('No providers enabled')).toBeTruthy();
      expect(
        screen.getByText('Turn a provider on in Catalog to see its models here.'),
      ).toBeTruthy();
      const link = screen.getByRole('link', { name: 'Browse providers in Catalog →' });
      expect(link).toHaveAttribute('href', '/agent-studio/providers/catalog');
      expect(screen.getByText('0 of 0 models · 0 enabled')).toBeTruthy();
    });

    it('re-enabling restores the group (filter follows the toggle, not the fixture)', () => {
      // Disabled first…
      fixtureOverrideRef.current = disableProviders(fixture(), 'xai');
      const { unmount } = renderPage();
      expect(screen.queryByText('xAI')).toBeNull();
      unmount();
      cleanup();
      // …then re-enabled: the engine drops the reason and the group returns.
      fixtureOverrideRef.current = fixture();
      renderPage();
      expect(screen.getByText('xAI')).toBeTruthy();
      expect(screen.getByText('Grok Reasoner')).toBeTruthy();
      expect(screen.getByText('7 of 7 models · 3 enabled')).toBeTruthy();
    });
  });

  describe('status filter chips (Enabled / Disabled / Pinned)', () => {
    // Row assertions use switch aria-labels (unique per row): model names
    // also render in the DefaultBar, so bare text queries over-count.
    it('Enabled shows only switch-ON rows; the counts line narrows shown, not total', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Enabled' }));
      expect(screen.getByText('3 of 7 models · 3 enabled')).toBeTruthy();
      expect(
        screen.getByRole('switch', { name: /GPT-4o \(platform\)/ }),
      ).toBeTruthy();
      expect(
        screen.getByRole('switch', { name: /GPT-4o \(BYOK Production Key\)/ }),
      ).toBeTruthy();
      expect(screen.getByText('Llama 3.3 70B Instruct')).toBeTruthy();
      expect(screen.queryByRole('switch', { name: /GPT-4o Mini \(platform\)/ })).toBeNull();
      expect(screen.queryByText('Claude 3.7 Sonnet')).toBeNull();
      expect(screen.queryByText('Grok Reasoner')).toBeNull();
    });

    it('Disabled shows only switch-OFF rows', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));
      expect(screen.getByText('4 of 7 models · 3 enabled')).toBeTruthy();
      expect(screen.queryByRole('switch', { name: /GPT-4o \(platform\)/ })).toBeNull();
      expect(
        screen.getByRole('switch', { name: /GPT-4o Mini \(platform\)/ }),
      ).toBeTruthy();
      expect(screen.getByText('Claude 3.7 Sonnet')).toBeTruthy();
    });

    it('Enabled + Disabled together are a tautology (no filtering)', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Enabled' }));
      fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));
      expect(screen.getByText('7 of 7 models · 3 enabled')).toBeTruthy();
      expect(screen.getByText('Grok Reasoner')).toBeTruthy();
    });

    it('Pinned shows only rows used by assistants', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Pinned' }));
      expect(screen.getByText('1 of 7 models · 3 enabled')).toBeTruthy();
      // Only the BYOK GPT-4o row is pinned — the platform twin is hidden.
      expect(
        screen.getByRole('switch', { name: /GPT-4o \(BYOK Production Key\)/ }),
      ).toBeTruthy();
      expect(screen.queryByRole('switch', { name: /GPT-4o \(platform\)/ })).toBeNull();
      expect(screen.queryByText('Llama 3.3 70B Instruct')).toBeNull();
    });

    it('Enabled + Pinned intersect; Clear restores everything', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Enabled' }));
      fireEvent.click(screen.getByRole('button', { name: 'Pinned' }));
      expect(screen.getByText('1 of 7 models · 3 enabled')).toBeTruthy();
      expect(
        screen.getByRole('switch', { name: /GPT-4o \(BYOK Production Key\)/ }),
      ).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }));
      expect(screen.getByText('7 of 7 models · 3 enabled')).toBeTruthy();
      expect(screen.getByText('Grok Reasoner')).toBeTruthy();
    });
  });
});
