// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { ApiError } from '@lib/engine/client';
import toast from 'react-hot-toast';
import { ModelSection } from './ModelSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';
import type { BuilderModelRow } from '../lib/useGroupedModels';

const saveMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    // Locked-row subscription links stand in as plain anchors — routing is
    // out of scope here; the href is what we assert.
    Link: ({ children, to }: { children?: ReactNode; to?: string }) => <a href={to ?? '#'}>{children}</a>,
  };
});

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useSaveDraftVersion: () => ({ mutate: saveMutate, isPending: false }),
    useUpdateDraftVersion: () => ({ mutate: updateMutate, isPending: false }),
    useAssistantDefinition: () => ({
      data: {
        definition: { ...defaultConsumer(), instructions: '## Role\nR.\n' },
        versionId: 'v9',
        hash: 'h2',
        status: 'DRAFT',
        isDraft: true,
      },
      isPending: false,
      isFetching: false,
      isError: false,
    }),
  };
});

/** N-5 grouped rows (Phase 6): the picker's only source. Per-test override. */
function groupedRow(ref: string, overrides: Partial<BuilderModelRow> = {}): BuilderModelRow {
  const slash = ref.indexOf('/');
  const provider = ref.slice(0, slash);
  const modelId = ref.slice(slash + 1);
  const credentialId = overrides.credentialId ?? null;
  return {
    key: credentialId ? `byok|${ref}|${credentialId}` : `platform|${ref}|`,
    supergroup: credentialId ? 'byok' : 'platform',
    provider,
    providerDisplayName: provider,
    credentialId,
    credentialLabel: credentialId ? 'Test Key' : null,
    modelId,
    ref,
    displayName: `${provider} ${modelId}`,
    usable: true,
    enabled: true,
    reasons: [],
    capabilities: { tools: true, vision: false, reasoning: false, structured_output: false },
    requiredProduct: null,
    requiredProductLabel: null,
    pinnedBy: [],
    contextWindowTokens: null,
    ...overrides,
  };
}

// Per-test grouped override: `undefined` = the grouped read is still
// unresolved (loading or fetch failed). Tests mutate `.rows` and restore it.
const mockGrouped = vi.hoisted(() => {
  const rows: BuilderModelRow[] = [];
  return { rows: rows as BuilderModelRow[] | undefined, isError: false };
});

vi.mock('../lib/useGroupedModels', () => ({
  useGroupedModels: () => ({
    data: mockGrouped.rows,
    rowByKey: new Map((mockGrouped.rows ?? []).map((r) => [r.key, r])),
    isError: mockGrouped.isError,
    isPending: false,
    isFetching: false,
  }),
}));

// Per-test org-default override: `defaultValue` = the engine's default ref
// (null = no default set), `isError` = the fetch failed. Defaults to "no
// default" so the pre-existing tests never pre-select.
const mockOrgDefault = vi.hoisted(() => ({
  defaultValue: null as { provider: string; model_id: string } | null,
  isError: false,
}));

vi.mock('../../providers/hooks/useOrgDefaultModel', () => ({
  useOrgDefaultModel: () => ({
    data: mockOrgDefault.isError ? undefined : { default: mockOrgDefault.defaultValue },
    isError: mockOrgDefault.isError,
    isPending: false,
    isFetching: false,
  }),
}));

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return {
    ...actual,
    useModelCosts: () => ({ data: mockCosts.rows, isPending: false, isFetching: false, isError: false }),
  };
});

// Per-test cost override: `[]` = the catalog reports no prices.
const mockCosts = vi.hoisted(() => {
  const rows: { ref: string; costMicrosPer1kInput: number | null; costMicrosPer1kOutput: number | null }[] = [];
  return { rows };
});

vi.mock('@hooks/studio/useSetupProviders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupProviders')>();
  return {
    ...actual,
    // Read hook only — management hooks must never be consumed in the builder
    // (PRV-079 grep gate).
    useProviderCredentials: () => ({ data: [], isPending: false, isError: false }),
  };
});

vi.mock('@hooks/engine/billing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/engine/billing')>();
  return {
    ...actual,
    useEnterpriseStatus: () => ({ data: true, isPending: false, isError: false }),
  };
});

const DEFINITION: AgentDefinition = {
  ...defaultConsumer(),
  instructions: '## Role\nConcierge.\n',
  model_policy: { allowed_models: ['a/b'], fallback_enabled: false },
};

function seedGrouped() {
  mockGrouped.rows = [
    groupedRow('a/b', { displayName: 'A B', providerDisplayName: 'A' }),
    groupedRow('c/d', { displayName: 'C D', providerDisplayName: 'C' }),
    groupedRow('e/f', {
      displayName: 'E F',
      providerDisplayName: 'E',
      usable: false,
      reasons: ['subscription_required'],
      requiredProduct: 'payg',
      requiredProductLabel: 'Pay-as-you-go',
    }),
  ];
  mockGrouped.isError = false;
}

function shell(props?: Partial<React.ComponentProps<typeof ModelSection>>) {
  const onDirtyChange = vi.fn();
  const ui = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ModelSection
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
  return { onDirtyChange, ui };
}

beforeEach(() => {
  saveMutate.mockReset();
  updateMutate.mockReset();
  vi.mocked(toast.success).mockReset();
  seedGrouped();
  mockCosts.rows = [];
  mockOrgDefault.defaultValue = null;
  mockOrgDefault.isError = false;
});

afterEach(() => {
  vi.useRealTimers();
});

function withFakeTimers() {
  vi.useFakeTimers();
}

describe('ModelSection policy', () => {
  it('resolves the primary with usability and writes fallback flips', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    expect(screen.getAllByText('A B').length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByLabelText('Fallback'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition; expectedHash: string };
    expect(input.expectedHash).toBe('h1');
    expect(input.definition.model_policy.fallback_enabled).toBe(true);
    expect(input.definition.model_policy.allowed_models).toEqual(['a/b']);
  });

  it('shows the serving pipeline with the selected model', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText('Serving order')).toBeTruthy();
    expect(screen.getAllByText('A B').length).toBeGreaterThanOrEqual(1);
    // The serving-order badge marks the primary.
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('treats an unresolved grouped read as unknown — never a credential blocker', async () => {
    const previous = mockGrouped.rows;
    mockGrouped.rows = undefined;
    try {
      await act(async () => {
        shell();
      });
      // Unknown ≠ known-bad: no credential blocker while the grouped read is
      // unresolved, and the pipeline row still renders (not hidden).
      expect(screen.queryByText(/No .* credential — required by/)).toBeNull();
      expect(screen.getAllByText('a/b').length).toBeGreaterThanOrEqual(1);
    } finally {
      mockGrouped.rows = previous;
    }
  });

  it('raises no credential blocker once the grouped read confirms usability', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.queryByText(/No .* credential — required by/)).toBeNull();
    expect(screen.getAllByText('A B').length).toBeGreaterThanOrEqual(1);
  });

  it('shows reasoning effort as Default (unset) until the maker picks a value — no Medium pre-select (19-33)', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText(/Advanced/));
    const selected = (name: string) =>
      screen.getAllByRole('tab').find((tab) => tab.textContent === name)?.getAttribute('aria-selected');
    expect(selected('Default')).toBe('true');
    expect(selected('Medium')).toBe('false');
    // Picking a value then choosing Default clears it again — the unset state
    // is reachable by the maker, never a phantom write.
    fireEvent.click(screen.getAllByRole('tab').find((tab) => tab.textContent === 'Medium') as HTMLElement);
    expect(selected('Medium')).toBe('true');
    fireEvent.click(screen.getAllByRole('tab').find((tab) => tab.textContent === 'Default') as HTMLElement);
    expect(selected('Default')).toBe('true');
    expect(selected('Medium')).toBe('false');
  });

  it('renders subscription-locked rows with the product label and billing path', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/Requires Pay-as-you-go — you don't have that/)).toBeTruthy();
    const link = screen.getByRole('link', { name: /view subscription options/i }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/agent-studio/settings/billing');
  });

  it('holds save on out-of-range params with named messages', async () => {
    withFakeTimers();
    await act(async () => {
      shell({
        definition: { ...DEFINITION, model_params: { temperature: 9 } },
      });
    });
    expect(screen.getByText(/Temperature must be 0–2/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('holds save on an out-of-range reasoning budget with the named message (PRV-073)', async () => {
    withFakeTimers();
    await act(async () => {
      shell({
        definition: { ...DEFINITION, model_params: { reasoning_budget_tokens: 0 } },
      });
    });
    expect(screen.getByText(/Reasoning budget must be a whole number of tokens, 1–100000/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('saves a valid reasoning budget through model_params (Phase 6 per-assistant persistence)', async () => {
    withFakeTimers();
    await act(async () => {
      shell({
        definition: { ...DEFINITION, model_params: { reasoning_budget_tokens: 16000 } },
      });
    });
    fireEvent.click(screen.getByText(/Advanced/));
    // The budget reads back formatted; the helper names the semantics.
    expect(screen.getByDisplayValue('16,000')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Fallback'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_params.reasoning_budget_tokens).toBe(16000);
  });

  it('holds save on invalid schemas with the failure named', async () => {
    withFakeTimers();
    await act(async () => {
      // The schema is authored in the focused editor (never a raw textarea);
      // an invalid schema arriving on the definition still holds the save.
      shell({
        definition: { ...DEFINITION, model_params: { output_schema: '{nope' } },
      });
    });
    expect(screen.getByText(/Not valid JSON/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('reorders the serving pipeline through the row buttons', async () => {
    withFakeTimers();
    await act(async () => {
      shell({ definition: { ...DEFINITION, model_policy: { allowed_models: ['a/b', 'c/d'], fallback_enabled: true } } });
    });
    fireEvent.click(screen.getByLabelText('Move A B down'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_policy.allowed_models).toEqual(['c/d', 'a/b']);
    // The pipeline carries the new order; allowed_models is derived from it.
    expect(input.definition.model_policy.pipeline?.map((entry) => entry.ref)).toEqual(['c/d', 'a/b']);
  });

  it('propagates dirty state to the parent', async () => {
    withFakeTimers();
    let onDirtyChange!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onDirtyChange } = shell());
    });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByLabelText('Fallback'));
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });

  it('response format Text→JSON→Text round trip reads clean — no phantom unsaved changes (wave-3 P2)', async () => {
    let onDirtyChange!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onDirtyChange } = shell());
    });
    // The wire omits response_format: the section opens on the Text default, clean.
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    const formatTabs = screen.getByRole('tablist', { name: 'Response format' });
    const formatTab = (name: string) => within(formatTabs).getByRole('tab', { name });
    fireEvent.click(formatTab('JSON'));
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    // Returning to the default must converge with the omitted source — the
    // commit path writes unset for 'text', never the literal, so the dirty
    // compare reads clean instead of phantoming until Reset all.
    fireEvent.click(formatTab('Text'));
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("treats an explicit wire 'text' response_format as the unset default — clean on load and after a round trip", async () => {
    let onDirtyChange!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onDirtyChange } = shell({
        definition: { ...DEFINITION, model_params: { response_format: 'text' } },
      }));
    });
    // Legacy explicit-'text' (written by older saves) normalizes to the
    // omitted default on read — clean on load, not dirty.
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    const formatTabs = screen.getByRole('tablist', { name: 'Response format' });
    const formatTab = (name: string) => within(formatTabs).getByRole('tab', { name });
    fireEvent.click(formatTab('JSON'));
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(formatTab('Text'));
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it('flushes pending edits on unmount instead of dropping them', async () => {
    withFakeTimers();
    let ui!: ReturnType<typeof render>;
    await act(async () => {
      ({ ui } = shell());
    });
    fireEvent.click(screen.getByLabelText('Fallback'));
    // Unmount before the 8s debounce fires — the flush must still save.
    await act(async () => {
      ui.unmount();
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_policy.fallback_enabled).toBe(true);
  });

  it('adopts a 409 draft opened elsewhere and keeps editing', async () => {
    withFakeTimers();
    saveMutate.mockImplementationOnce((_input: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new ApiError(409, 'conflict', 'a draft version already exists for this assistant'));
    });
    await act(async () => {
      shell({ isDraft: false, versionId: null, versionHash: null });
    });
    fireEvent.click(screen.getByLabelText('Fallback'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(saveMutate).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/draft opened elsewhere/i));
  });

  it('renders the 412 dialog with the policy diff and saves over fresh', async () => {
    withFakeTimers();
    updateMutate.mockImplementationOnce((_input: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new ApiError(412, 'precondition_failed', 'stale', { expected: 'h1', current: 'h2' }));
    });
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Fallback'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(screen.getByText(/Someone saved first/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Save mine over theirs/));
    expect(updateMutate).toHaveBeenCalledTimes(2);
    const retry = updateMutate.mock.calls[1][0] as { expectedHash: string; definition: AgentDefinition };
    expect(retry.expectedHash).toBe('h2');
    expect(retry.definition.model_policy.fallback_enabled).toBe(true);
  });

  it('renders read-only for viewers (policy visible, controls dead)', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    expect(screen.getAllByText('A B').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByLabelText('Fallback')).toBeNull();
    // The fallback policy still reads as text in the readiness card.
    expect(screen.getByText(/Single model — fallback not needed/)).toBeTruthy();
  });
});

describe('ModelSection manual save signal', () => {
  it('fires doSave exactly once when saveSignal increments', async () => {
    let ui: ReturnType<typeof shell>['ui'];
    await act(async () => {
      ({ ui } = shell({ saveSignal: 0 }));
    });
    // A pre-existing signal on mount is stale (the 412 guard) — it must not fire.
    expect(updateMutate).not.toHaveBeenCalled();
    await act(async () => {
      ui.rerender(
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <ModelSection
              assistantId="agent-main"
              definition={DEFINITION}
              versionId="v1"
              versionHash="h1"
              isDraft
              canAuthor
              onDirtyChange={vi.fn()}
              saveSignal={1}
            />
          </QueryClientProvider>
        </ThemeProvider>,
      );
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { expectedHash: string };
    expect(input.expectedHash).toBe('h1');
  });

  it('does not save on mount when saveSignal is 0', async () => {
    await act(async () => {
      shell();
    });
    expect(updateMutate).not.toHaveBeenCalled();
    expect(saveMutate).not.toHaveBeenCalled();
  });
});

describe('ModelSection group headings', () => {
  it('renders the three SectionGroup labels (not empty headings)', async () => {
    await act(async () => {
      shell();
    });
    // Labels may appear in both the group heading and descriptive copy —
    // assert each is present (at least once), never an empty heading.
    // (Phase 6: the Credentials group moved to the Providers page.)
    for (const label of ['Pipeline', 'Catalog', 'Defaults']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText('Credentials')).toBeNull();
  });

  it('renders the group descriptions under their headings', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText('The models that serve this agent, in order. Configure each one below.')).toBeTruthy();
    expect(
      screen.getByText('Models enabled for your organization in Providers → Models. Toggled-off models are hidden; locked rows name the subscription they need.'),
    ).toBeTruthy();
    expect(screen.getByText('Generation defaults for every run. Unset means the model default. Per-model overrides live in the pipeline above.')).toBeTruthy();
  });
});

describe('ModelSection pipeline pricing (W18)', () => {
  it('renders a single "Pricing not listed" when the catalog reports no cost — never suffixed', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getAllByText('Pricing not listed').length).toBeGreaterThan(0);
    // The placeholder must never compose with the in/out suffixes.
    expect(screen.queryByText(/Pricing not listed ?(in|out)/)).toBeNull();
  });

  it('renders priced in/out with their suffixes', async () => {
    mockCosts.rows = [{ ref: 'a/b', costMicrosPer1kInput: 3000, costMicrosPer1kOutput: 15000 }];
    await act(async () => {
      shell();
    });
    expect(screen.getByText('$3.00/1M in · $15.00/1M out')).toBeTruthy();
  });

  it('renders a half-priced row with a suffix only on the priced side', async () => {
    mockCosts.rows = [{ ref: 'a/b', costMicrosPer1kInput: 3000, costMicrosPer1kOutput: null }];
    await act(async () => {
      shell();
    });
    expect(screen.getByText('$3.00/1M in')).toBeTruthy();
    expect(screen.queryByText(/\$[0-9.]+..M out/)).toBeNull();
    expect(screen.queryByText(/Pricing not listed ?(in|out)/)).toBeNull();
  });
});

describe('ModelSection credential block exemption (W19)', () => {
  it('serves a platform-pool row with no credential helper — "no credential needed"', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Expand A B configuration'));
    expect(screen.getByText('Served by platform pool — no credential needed')).toBeTruthy();
    // The old copy ("No A credential connected. Connect A →") must be gone.
    expect(screen.queryByText(/No A credential connected/)).toBeNull();
    expect(screen.queryByRole('link', { name: 'Connect A →' })).toBeNull();
  });

  it('renders an honest unavailable state for a stored ref missing from the catalog', async () => {
    // A dangling default (e.g. a removed model) must never crash or silently
    // substitute — it renders "Model unavailable" with the raw ref.
    mockGrouped.rows = [];
    await act(async () => {
      shell({
        definition: {
          ...DEFINITION,
          model_policy: { allowed_models: ['mock/neryva/demo'], fallback_enabled: false },
        },
      });
    });
    expect(screen.getByText('Model unavailable — no longer offered. Remove it or pick a replacement.')).toBeTruthy();
  });

  it('still offers the connect helper for a genuine provider_credential_missing blocker', async () => {
    mockGrouped.rows = [
      groupedRow('c/d', {
        displayName: 'C D',
        providerDisplayName: 'C',
        usable: false,
        reasons: ['provider_credential_missing'],
      }),
    ];
    await act(async () => {
      shell({
        definition: {
          ...DEFINITION,
          model_policy: { allowed_models: ['c/d'], fallback_enabled: false },
        },
      });
    });
    fireEvent.click(screen.getByLabelText('Expand C D configuration'));
    // Not over-exempted: the readiness panel flags this row, so the row must
    // still name the missing credential and the next step.
    expect(screen.getByText(/Connect a C credential to serve this model/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Connect C →' })).toBeTruthy();
  });
});

describe('ModelSection org default pre-selection (guided setup only)', () => {
  const EMPTY_DEFINITION: AgentDefinition = {
    ...DEFINITION,
    model_policy: { allowed_models: [], fallback_enabled: false },
  };

  function pipelineScope() {
    const el = document.getElementById('model-pipeline');
    if (!el) throw new Error('#model-pipeline not rendered');
    return within(el);
  }

  it('pre-selects the org default as a normal, changeable selection on setup-flow init', async () => {
    mockOrgDefault.defaultValue = { provider: 'c', model_id: 'd' };
    let onDirtyChange!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onDirtyChange } = shell({ isSetupFlow: true, definition: EMPTY_DEFINITION }));
    });
    // The defaulted model serves as the primary — a real pipeline entry.
    expect(pipelineScope().getByText('C D')).toBeTruthy();
    expect(pipelineScope().getByText('1')).toBeTruthy();
    // Behaving exactly like a manual pick: the draft reads dirty.
    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });

  it('never pre-selects in the edit flow', async () => {
    mockOrgDefault.defaultValue = { provider: 'c', model_id: 'd' };
    await act(async () => {
      shell({ definition: EMPTY_DEFINITION });
    });
    expect(pipelineScope().queryByText('C D')).toBeNull();
    expect(expect(screen.getAllByText(/No models yet \u2014 add one from the catalog below/).length).toBeGreaterThanOrEqual(1)).toBeTruthy();
  });

  it('never overrides an explicit user choice in the setup flow', async () => {
    mockOrgDefault.defaultValue = { provider: 'c', model_id: 'd' };
    await act(async () => {
      // DEFINITION already pins a/b — the default must not replace it.
      shell({ isSetupFlow: true, definition: DEFINITION });
    });
    expect(pipelineScope().getByText('A B')).toBeTruthy();
    expect(pipelineScope().queryByText('C D')).toBeNull();
  });

  it('keeps existing behavior when no default is set', async () => {
    mockOrgDefault.defaultValue = null;
    await act(async () => {
      shell({ isSetupFlow: true, definition: EMPTY_DEFINITION });
    });
    expect(pipelineScope().queryByText('C D')).toBeNull();
    expect(expect(screen.getAllByText(/No models yet \u2014 add one from the catalog below/).length).toBeGreaterThanOrEqual(1)).toBeTruthy();
  });

  it('keeps existing behavior when the default fetch fails', async () => {
    mockOrgDefault.isError = true;
    await act(async () => {
      shell({ isSetupFlow: true, definition: EMPTY_DEFINITION });
    });
    expect(pipelineScope().queryByText('C D')).toBeNull();
    expect(expect(screen.getAllByText(/No models yet \u2014 add one from the catalog below/).length).toBeGreaterThanOrEqual(1)).toBeTruthy();
  });

  it('keeps existing behavior when the defaulted model is not in the available list', async () => {
    mockOrgDefault.defaultValue = { provider: 'x', model_id: 'y' };
    await act(async () => {
      shell({ isSetupFlow: true, definition: EMPTY_DEFINITION });
    });
    expect(expect(screen.getAllByText(/No models yet \u2014 add one from the catalog below/).length).toBeGreaterThanOrEqual(1)).toBeTruthy();
  });

  it('keeps existing behavior when the defaulted model is not usable', async () => {
    mockOrgDefault.defaultValue = { provider: 'c', model_id: 'd' };
    mockGrouped.rows = [
      groupedRow('c/d', {
        displayName: 'C D',
        providerDisplayName: 'C',
        usable: false,
        reasons: ['model_disabled_by_org'],
      }),
    ];
    await act(async () => {
      shell({ isSetupFlow: true, definition: EMPTY_DEFINITION });
    });
    expect(pipelineScope().queryByText('C D')).toBeNull();
    expect(expect(screen.getAllByText(/No models yet \u2014 add one from the catalog below/).length).toBeGreaterThanOrEqual(1)).toBeTruthy();
  });
});
