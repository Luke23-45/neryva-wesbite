// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import type { BuilderModelRow } from '../lib/useGroupedModels';
import { ModelPicker } from './ModelPicker';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    // Providers / billing links stand in as plain anchors — routing is out
    // of scope for catalog tests; the href is what we assert. `search` is
    // serialized into the query string so returnTo-carrying links stay
    // provable.
    Link: ({
      children,
      to,
      search,
    }: {
      children?: ReactNode;
      to?: string;
      search?: Record<string, string | undefined>;
    }) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(search ?? {})) {
        if (value !== undefined) params.set(key, value);
      }
      const query = params.toString();
      return <a href={`${to ?? '#'}${query ? `?${query}` : ''}`}>{children}</a>;
    },
  };
});

function row(overrides: Partial<BuilderModelRow> = {}): BuilderModelRow {
  return {
    key: 'platform|anthropic/claude-sonnet-4-5|',
    supergroup: 'platform',
    provider: 'anthropic',
    providerDisplayName: 'Anthropic',
    credentialId: null,
    credentialLabel: null,
    modelId: 'claude-sonnet-4-5',
    ref: 'anthropic/claude-sonnet-4-5',
    displayName: 'Claude Sonnet 4.5',
    usable: true,
    enabled: true,
    reasons: [],
    capabilities: { tools: true, vision: true, reasoning: false, structured_output: false },
    requiredProduct: null,
    requiredProductLabel: null,
    pricing: { input_per_1m: '3.00', output_per_1m: '15.00' },
    contextWindowTokens: 200000,
    pinnedBy: [],
    ...overrides,
  };
}

const BYOK_UUID = 'cred-uuid-1';
const BETA_UUID = 'cred-uuid-2';

function byok(overrides: Partial<BuilderModelRow> = {}): BuilderModelRow {
  return row({
    key: `byok|openai/gpt-4o|${BYOK_UUID}`,
    supergroup: 'byok',
    provider: 'openai',
    providerDisplayName: 'OpenAI',
    credentialId: BYOK_UUID,
    credentialLabel: 'Acme key',
    modelId: 'gpt-4o',
    ref: 'openai/gpt-4o',
    displayName: 'GPT-4o',
    pricing: undefined,
    contextWindowTokens: 128000,
    ...overrides,
  });
}

const ROWS: BuilderModelRow[] = [
  row(),
  row({
    key: 'platform|openai/gpt-4o|',
    provider: 'openai',
    providerDisplayName: 'OpenAI',
    modelId: 'gpt-4o',
    ref: 'openai/gpt-4o',
    displayName: 'GPT-4o',
    usable: false,
    reasons: ['provider_not_enabled'],
    capabilities: { tools: true, vision: true, reasoning: false, structured_output: false },
    pricing: undefined,
  }),
  row({
    key: 'platform|openai/gpt-5-eu|',
    provider: 'openai',
    providerDisplayName: 'OpenAI',
    modelId: 'gpt-5-eu',
    ref: 'openai/gpt-5-eu',
    displayName: 'GPT-5 EU',
    usable: false,
    reasons: ['residency_incompatible'],
    capabilities: { tools: false, vision: false, reasoning: false, structured_output: false },
    pricing: undefined,
  }),
  row({
    key: 'platform|deepseek/chat|',
    provider: 'deepseek',
    providerDisplayName: 'DeepSeek',
    modelId: 'chat',
    ref: 'deepseek/chat',
    displayName: 'DeepSeek Chat',
    usable: false,
    reasons: ['provider_credential_missing'],
    capabilities: { tools: false, vision: false, reasoning: false, structured_output: false },
    pricing: undefined,
  }),
  row({
    key: 'platform|anthropic/claude-opus-4-5|',
    modelId: 'claude-opus-4-5',
    ref: 'anthropic/claude-opus-4-5',
    displayName: 'Claude Opus 4.5',
    usable: false,
    reasons: ['subscription_required'],
    requiredProduct: 'payg',
    requiredProductLabel: 'Pay-as-you-go',
    capabilities: { tools: true, vision: false, reasoning: false, structured_output: false },
    pricing: undefined,
  }),
  row({
    key: 'platform|openai/gpt-4o-compromised|',
    provider: 'openai',
    providerDisplayName: 'OpenAI',
    modelId: 'gpt-4o-compromised',
    ref: 'openai/gpt-4o-compromised',
    displayName: 'GPT-4o (compromised)',
    usable: false,
    reasons: ['credential_compromised'],
    capabilities: { tools: false, vision: false, reasoning: false, structured_output: false },
    pricing: undefined,
  }),
  row({
    key: 'platform|google/gemini-3|',
    provider: 'google',
    providerDisplayName: 'Google',
    modelId: 'gemini-3',
    ref: 'google/gemini-3',
    displayName: 'Gemini 3',
    usable: false,
    enabled: false,
    reasons: ['model_disabled_by_org'],
    capabilities: { tools: true, vision: false, reasoning: false, structured_output: false },
    pricing: undefined,
  }),
  byok(),
  byok({
    key: `byok|xai/grok-4|${BETA_UUID}`,
    provider: 'xai',
    providerDisplayName: 'xAI',
    credentialId: BETA_UUID,
    credentialLabel: 'Beta key',
    modelId: 'grok-4',
    ref: 'xai/grok-4',
    displayName: 'Grok 4',
  }),
];

const DEMO_ROW = row({
  key: 'platform|mock/neryva/demo|',
  provider: 'mock',
  providerDisplayName: 'mock',
  modelId: 'neryva/demo',
  ref: 'mock/neryva/demo',
  displayName: 'Neryva Demo',
  capabilities: { tools: false, vision: false, reasoning: false, structured_output: false },
  pricing: undefined,
  contextWindowTokens: 8000,
});

function shell(props?: Partial<React.ComponentProps<typeof ModelPicker>>) {
  const onToggle = vi.fn();
  const ui = render(
    <ThemeProvider theme={theme}>
      <ModelPicker
        rows={ROWS}
        pipelineKeys={new Set(['platform|anthropic/claude-sonnet-4-5|'])}
        credBlockedKeys={new Set()}
        pinnedToolCount={0}
        canAuthor
        isEnterprise
        returnTo="/agent-studio/agents/agent-1/build"
        onToggle={onToggle}
        {...props}
      />
    </ThemeProvider>,
  );
  return { onToggle, ui };
}

describe('ModelPicker supergroups (PRV-075)', () => {
  it('renders platform and BYOK supergroup headers in order', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText('Platform managed')).toBeTruthy();
    expect(screen.getByText('BYOK — Acme key')).toBeTruthy();
    expect(screen.getByText('BYOK — Beta key')).toBeTruthy();
    // Platform first, then BYOK groups in row order.
    const headers = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headers).toEqual(['Platform managed', 'BYOK — Acme key', 'BYOK — Beta key']);
  });

  it('renders the same model from both sources as two distinct rows', async () => {
    await act(async () => {
      shell();
    });
    // Two checkboxes, both labeled GPT-4o — distinct React keys under the
    // hood (`platform|…|` vs `byok|…|<uuid>`).
    expect(screen.getAllByLabelText(/^GPT-4o( —|$)/)).toHaveLength(2);
    // One carries the BYOK credential suffix, the other doesn't.
    expect(screen.getByText(/Anthropic · claude-sonnet-4-5/)).toBeTruthy();
    expect(screen.getByText(/BYOK · Acme key/)).toBeTruthy();
  });

  it('keeps provider sub-groups with their counts inside each supergroup', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/Anthropic · 2/)).toBeTruthy();
    expect(screen.getByText(/OpenAI · 3/)).toBeTruthy();
  });

  it('filters by credential label through search', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByLabelText('Search model catalog'), { target: { value: 'acme' } });
    expect(screen.getByText('BYOK — Acme key')).toBeTruthy();
    expect(screen.queryByText('BYOK — Beta key')).toBeNull();
    expect(screen.getByText('GPT-4o')).toBeTruthy();
    expect(screen.queryByText('Claude Sonnet 4.5')).toBeNull();
  });
});

describe('ModelPicker BYOK supergroup empty state (W20)', () => {
  it('always renders the BYOK supergroup with an empty state when no verified credentials exist', async () => {
    await act(async () => {
      shell({ rows: [row()] });
    });
    expect(screen.getByText('Platform managed')).toBeTruthy();
    expect(screen.getByText('BYOK')).toBeTruthy();
    expect(
      screen.getByText('No connected credentials — connect a key to see its discovered models here.'),
    ).toBeTruthy();
  });

  it('shows no empty state when BYOK rows exist', async () => {
    await act(async () => {
      shell();
    });
    expect(
      screen.queryByText('No connected credentials — connect a key to see its discovered models here.'),
    ).toBeNull();
  });

  it('never claims "no credentials" when a search merely filters BYOK rows out', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByLabelText('Search model catalog'), { target: { value: 'claude' } });
    // BYOK rows exist in the catalog but match nothing — no per-credential
    // sections, and no dishonest empty state either.
    expect(screen.queryByText('BYOK — Acme key')).toBeNull();
    expect(
      screen.queryByText('No connected credentials — connect a key to see its discovered models here.'),
    ).toBeNull();
  });

  it('keeps the empty state during search when no BYOK rows exist — the claim stays true', async () => {
    await act(async () => {
      shell({ rows: [row()] });
    });
    fireEvent.change(screen.getByLabelText('Search model catalog'), { target: { value: 'claude' } });
    expect(screen.getByText('BYOK')).toBeTruthy();
    expect(
      screen.getByText('No connected credentials — connect a key to see its discovered models here.'),
    ).toBeTruthy();
  });

  it('does not claim "no credentials" while the catalog is still loading', async () => {
    await act(async () => {
      shell({ rows: undefined, loadError: false });
    });
    expect(
      screen.queryByText('No connected credentials — connect a key to see its discovered models here.'),
    ).toBeNull();
  });
});

describe('ModelPicker tool-compat badge (PRV-076)', () => {
  it('renders only when pinnedToolCount > 0 and the model lacks tool support', async () => {
    await act(async () => {
      shell({ pinnedToolCount: 2 });
    });
    const badges = screen.getAllByText('Incompatible: no tool support');
    expect(badges.length).toBeGreaterThan(0);
    // Claude Sonnet 4.5 HAS tool support — its row must not carry the badge.
    const sonnetRow = (screen.getByText('Claude Sonnet 4.5') as HTMLElement).closest('label');
    expect(sonnetRow?.textContent).not.toContain('Incompatible: no tool support');
  });

  it('renders no badge when pinnedToolCount is 0 — the prop is the source', async () => {
    await act(async () => {
      shell({ pinnedToolCount: 0 });
    });
    expect(screen.queryByText('Incompatible: no tool support')).toBeNull();
  });
});

describe('ModelPicker per-reason rendering (PRV-080)', () => {
  it('links provider_credential_missing to Providers for enterprise', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/credential missing/)).toBeTruthy();
    const link = screen.getByRole('link', { name: /connect a credential/i }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/agent-studio/providers/my-providers');
  });

  it('stays truthful for non-enterprise: no dead connect action', async () => {
    await act(async () => {
      shell({ isEnterprise: false });
    });
    expect(screen.getByText(/Neryva-managed credentials apply — no action needed/)).toBeTruthy();
    expect(screen.queryByRole('link', { name: /connect a credential/i })).toBeNull();
  });

  it('links provider_not_enabled to Providers', async () => {
    await act(async () => {
      shell();
    });
    const link = screen.getByRole('link', { name: /ask an admin to enable/i }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/agent-studio/providers/models');
  });

  it('renders model_disabled_by_org with its label and a Providers link', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/disabled by organization/)).toBeTruthy();
    const link = screen.getByRole('link', { name: /re-enable in providers/i }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/agent-studio/providers/models');
  });

  it('explains a subscription lock with the product label and a billing link', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/Requires Pay-as-you-go — you don't have that/)).toBeTruthy();
    const link = screen.getByRole('link', { name: /view subscription options/i }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/agent-studio/settings/billing');
  });

  it('renders credential_compromised in the red tone with a Providers link', async () => {
    await act(async () => {
      shell();
    });
    const el = screen.getByText(/credential_compromised \(derived\)/);
    // theme.app.status.error.fg = #f87171.
    expect(window.getComputedStyle(el).color).toBe('rgb(248, 113, 113)');
    const link = screen.getByRole('link', { name: /rotate the key/i }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/agent-studio/providers/my-providers');
  });

  it('renders non-red reasons in the amber tone', async () => {
    await act(async () => {
      shell();
    });
    const el = screen.getByText(/provider not enabled/);
    // theme.app.status.warning.fg = #fbbf24.
    expect(window.getComputedStyle(el).color).toBe('rgb(251, 191, 36)');
  });

  it('renders the demo-allowance reason with label text only (no link)', async () => {
    const allowanceRow = row({
      key: 'platform|mock/neryva/demo|',
      provider: 'mock',
      providerDisplayName: 'mock',
      modelId: 'neryva/demo',
      ref: 'mock/neryva/demo',
      displayName: 'Neryva Demo',
      usable: false,
      reasons: ['demo_conversation_limit_reached'],
      capabilities: { tools: false, vision: false, reasoning: false, structured_output: false },
      pricing: undefined,
    });
    await act(async () => {
      shell({ rows: [allowanceRow], pipelineKeys: new Set() });
    });
    expect(screen.getByText(/demo allowance used/)).toBeTruthy();
    // The row itself must render no link — only the footer link exists
    // elsewhere on the surface.
    const rowEl = (screen.getByText(/demo allowance used/) as HTMLElement).closest('label');
    expect(rowEl?.querySelectorAll('a')).toHaveLength(0);
  });
});

describe('ModelPicker footer, toggle, and gating', () => {
  it('renders the W22 footer link to Providers with a draft-safe returnTo', async () => {
    await act(async () => {
      shell();
    });
    const link = screen.getByRole('link', { name: /open providers/i }) as HTMLAnchorElement;
    const url = new URL(link.getAttribute('href')!, 'http://localhost');
    expect(url.pathname).toBe('/agent-studio/providers/catalog');
    expect(url.searchParams.get('returnTo')).toBe('/agent-studio/agents/agent-1/build');
    expect(screen.getByText(/Need another model or endpoint/)).toBeTruthy();
  });

  it('calls onToggle with (ref, credentialId) — null for platform, uuid for BYOK', async () => {
    let onToggle!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onToggle } = shell({ pipelineKeys: new Set() }));
    });
    fireEvent.click(screen.getByLabelText('Claude Sonnet 4.5'));
    expect(onToggle).toHaveBeenCalledWith('anthropic/claude-sonnet-4-5', null);
    // GPT-4o exists twice — the platform row (unusable, disabled) and the
    // BYOK row (usable). The platform null-credential case is covered by
    // the Sonnet click above.
    const boxes = screen.getAllByLabelText(/^GPT-4o( —|$)/) as HTMLInputElement[];
    expect(boxes).toHaveLength(2);
    expect(boxes[0].disabled).toBe(true);
    fireEvent.click(boxes[1]);
    expect(onToggle).toHaveBeenCalledWith('openai/gpt-4o', BYOK_UUID);
  });

  it('disables unusable rows but keeps in-pipeline unusable rows removable', async () => {
    let onToggle!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onToggle } = shell({
        pipelineKeys: new Set(['platform|anthropic/claude-opus-4-5|']),
      }));
    });
    const locked = screen.getByLabelText(/Claude Opus 4\.5 — unusable/) as HTMLInputElement;
    expect(locked.disabled).toBe(false);
    fireEvent.click(locked);
    expect(onToggle).toHaveBeenCalledWith('anthropic/claude-opus-4-5', null);
    const deepseek = screen.getByLabelText(/DeepSeek Chat — unusable/) as HTMLInputElement;
    expect(deepseek.disabled).toBe(true);
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

  it('renders pricing from the row, and "Pricing not listed" when absent', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/\$3\.00\/1M in · \$15\.00\/1M out/)).toBeTruthy();
    expect(screen.getAllByText('Pricing not listed').length).toBeGreaterThan(0);
  });

  it('states the picked count and cap honestly — never as a catalog size (W17)', async () => {
    await act(async () => {
      shell();
    });
    // The badge names the pipeline cap ("max 20"), not the catalog size.
    expect(screen.getByText('1 picked · max 20')).toBeTruthy();
    expect(screen.getByLabelText('1 picked · max 20').textContent).toBe('1 picked · max 20');
    expect(screen.queryByText(/model cap/)).toBeNull();
  });

  it('states an unreachable catalog honestly', async () => {
    await act(async () => {
      shell({ rows: undefined, loadError: true });
    });
    expect(screen.getByText(/Catalog unreachable — retry the page\. Saving without a picked model is refused/)).toBeTruthy();
  });

  it('states a zero-match search honestly', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByLabelText('Search model catalog'), { target: { value: 'no-such-model' } });
    expect(screen.getByText(/No models match/)).toBeTruthy();
  });
});

describe('ModelPicker demo group (build spec v3 §1/§6)', () => {
  it('renders its own group with the pinned display name and a badge', async () => {
    await act(async () => {
      shell({ rows: [DEMO_ROW], pipelineKeys: new Set() });
    });
    expect(screen.getByText('Platform managed')).toBeTruthy();
    expect(screen.getByText(/Free demo · 1/)).toBeTruthy();
    expect(screen.getByText('Free demo — mock responses, not AI')).toBeTruthy();
    expect(screen.getByText('Demo')).toBeTruthy();
  });

  it('keeps the demo row selectable when usable', async () => {
    let onToggle!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onToggle } = shell({ rows: [DEMO_ROW], pipelineKeys: new Set() }));
    });
    const box = screen.getByLabelText('Free demo — mock responses, not AI') as HTMLInputElement;
    expect(box.disabled).toBe(false);
    fireEvent.click(box);
    expect(onToggle).toHaveBeenCalledWith('mock/neryva/demo', null);
  });

  it('finds the demo row when searching the pinned name', async () => {
    await act(async () => {
      shell({ rows: [DEMO_ROW], pipelineKeys: new Set() });
    });
    fireEvent.change(screen.getByLabelText('Search model catalog'), { target: { value: 'mock responses' } });
    expect(screen.getByText('Free demo — mock responses, not AI')).toBeTruthy();
  });
});
