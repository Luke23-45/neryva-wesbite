// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';
import toast from 'react-hot-toast';
import { ModelSection } from './ModelSection';
import type { BuilderModelRow } from '../lib/useGroupedModels';

vi.mock('react-hot-toast', () => ({
  __esModule: true,
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
    Link: ({ children, to }: { children?: ReactNode; to?: string }) => <a href={to ?? '#'}>{children}</a>,
  };
});

const saveMutate = vi.fn();
const updateMutate = vi.fn();

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

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return {
    ...actual,
    useModelCosts: () => ({ data: [], isPending: false, isFetching: false, isError: false }),
  };
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
    groupedRow('c/d', {
      displayName: 'C D',
      providerDisplayName: 'C',
      usable: false,
      reasons: ['provider_credential_missing'],
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

/** The catalog checkbox for a display name, disambiguated by source. */
function pickerCheckbox(displayName: string, byok: boolean): HTMLElement {
  const boxes = screen.getAllByRole('checkbox', { name: displayName });
  const found = boxes.find((box) => {
    const text = box.closest('label')?.textContent ?? '';
    return byok ? text.includes('BYOK') : !text.includes('BYOK');
  });
  if (!found) throw new Error(`no ${byok ? 'BYOK' : 'platform'} checkbox for ${displayName}`);
  return found as HTMLElement;
}

beforeEach(() => {
  saveMutate.mockReset();
  updateMutate.mockReset();
  vi.mocked(toast.success).mockReset();
  seedGrouped();
});

afterEach(() => {
  vi.useRealTimers();
});

function withFakeTimers() {
  vi.useFakeTimers();
}

describe('ModelSection pipeline', () => {
  it('writes allowed_models derived from the pipeline refs on save', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    // Add C D (credential-missing but still addable) to the pipeline…
    fireEvent.click(screen.getByLabelText(/C D — unusable/));
    // …then remove it again (blast-radius: pinned_by is empty, so direct).
    fireEvent.click(screen.getByLabelText(/C D — unusable/));
    fireEvent.click(screen.getByLabelText('Fallback'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    // The pipeline carries the refs; allowed_models is derived from them.
    expect(input.definition.model_policy.pipeline?.map((entry) => entry.ref)).toEqual(['a/b']);
    expect(input.definition.model_policy.allowed_models).toEqual(['a/b']);
  });

  it('holds the save when a pipeline model needs a credential — with the named message', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    // Add C D, whose grouped row reports provider_credential_missing and the
    // mocked credential read holds no credential for provider "c".
    fireEvent.click(screen.getByLabelText(/C D — unusable/));
    // The blocker names the provider and the model, and points at Providers
    // (the vault panel is gone — doc 20 §3.5).
    expect(screen.getByText(/No C credential — required by C D\. Connect one on the Providers page\./)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
    // Removing the blocked model clears the blocker…
    fireEvent.click(screen.getByLabelText('Remove C D'));
    expect(screen.queryByText(/No C credential — required by/)).toBeNull();
    // …and a fresh change saves again (the add+remove netted to zero dirty).
    fireEvent.click(screen.getByLabelText('Fallback'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
  });

  it('holds the save when response format is Schema without a valid JSON schema', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText(/Advanced/));
    fireEvent.click(screen.getByRole('tab', { name: 'Schema' }));
    // Schema format with no schema authored yet → named blocker.
    expect(screen.getByText(/Response format is Schema — add a valid JSON schema\./)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('reset-all clears the defaults back to the engine baseline', async () => {
    withFakeTimers();
    await act(async () => {
      shell({
        definition: {
          ...DEFINITION,
          model_params: { temperature: 0.9, response_format: 'json', output_schema: '{"type":"object"}' },
        },
      });
    });
    fireEvent.click(screen.getByText(/Advanced/));
    expect(screen.getByDisplayValue('0.9')).toBeTruthy();
    fireEvent.click(screen.getByText('Reset all'));
    // Temperature clears to unset; format falls back to Text (engine default);
    // the schema editor empties.
    expect(screen.queryByDisplayValue('0.9')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Text', selected: true })).toBeTruthy();
    expect(updateMutate).not.toHaveBeenCalled();
  });
});

describe('ModelSection supergroup pins (PRV-075 / PRV-081a,c)', () => {
  const EMPTY: AgentDefinition = {
    ...defaultConsumer(),
    instructions: '## Role\nConcierge.\n',
    model_policy: { allowed_models: [], fallback_enabled: false },
  };

  function seedBothSources() {
    mockGrouped.rows = [
      groupedRow('a/b', { displayName: 'A B', providerDisplayName: 'A' }),
      groupedRow('a/b', { displayName: 'A B', providerDisplayName: 'A', credentialId: 'cred-1' }),
    ];
  }

  it('selecting the BYOK row pins credential_id: uuid in the draft payload', async () => {
    withFakeTimers();
    seedBothSources();
    await act(async () => {
      shell({ definition: EMPTY });
    });
    fireEvent.click(pickerCheckbox('A B', true));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_policy.pipeline).toEqual([{ ref: 'a/b', credential_id: 'cred-1' }]);
    expect(input.definition.model_policy.allowed_models).toEqual(['a/b']);
  });

  it('selecting the platform row leaves credential_id absent (null = platform pool)', async () => {
    withFakeTimers();
    seedBothSources();
    await act(async () => {
      shell({ definition: EMPTY });
    });
    fireEvent.click(pickerCheckbox('A B', false));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_policy.pipeline).toEqual([{ ref: 'a/b' }]);
    expect(input.definition.model_policy.pipeline?.[0]).not.toHaveProperty('credential_id');
  });

  it('renders the same model from both sources as two distinct, labeled options', async () => {
    seedBothSources();
    await act(async () => {
      shell({ definition: EMPTY });
    });
    // Two supergroup sections; the BYOK row names its credential.
    expect(screen.getByText('Platform managed')).toBeTruthy();
    expect(screen.getByText('BYOK — Test Key')).toBeTruthy();
    expect(pickerCheckbox('A B', true)).toBeTruthy();
    expect(pickerCheckbox('A B', false)).toBeTruthy();
  });
});

describe('ModelSection tool-compat guard (PRV-076 / PRV-081d)', () => {
  function seedToolLess() {
    mockGrouped.rows = [
      groupedRow('c/d', {
        displayName: 'C D',
        providerDisplayName: 'C',
        capabilities: { tools: false, vision: false, reasoning: true, structured_output: false },
      }),
    ];
  }

  const WITH_TOOL: AgentDefinition = {
    ...defaultConsumer(),
    instructions: '## Role\nConcierge.\n',
    model_policy: { allowed_models: [], fallback_enabled: false },
    tools: [{ name: 'web_search', enabled: true } as AgentDefinition['tools'][number]],
  };

  it('warns amber and requires explicit confirmation to select a tool-less model', async () => {
    withFakeTimers();
    seedToolLess();
    await act(async () => {
      shell({ definition: WITH_TOOL });
    });
    // Amber badge on the row (badge-only in the picker).
    expect(screen.getByText('Incompatible: no tool support')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'C D' }));
    // The guard mounts with the explicit confirm step — warn, don't forbid.
    expect(screen.getByText('Select anyway')).toBeTruthy();
    expect(screen.getByText('Choose another')).toBeTruthy();
    fireEvent.click(screen.getByText('Select anyway'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_policy.allowed_models).toEqual(['c/d']);
  });

  it('cancelling the guard leaves the pipeline untouched', async () => {
    seedToolLess();
    await act(async () => {
      shell({ definition: WITH_TOOL });
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'C D' }));
    expect(screen.getByText('Select anyway')).toBeTruthy();
    fireEvent.click(screen.getByText('Choose another'));
    expect(screen.queryByText('Select anyway')).toBeNull();
    expect(screen.queryByText('Serving order')).toBeTruthy();
  });

  it('shows no tool warning when the draft has no pinned tools', async () => {
    seedToolLess();
    await act(async () => {
      shell({ definition: { ...WITH_TOOL, tools: [] } });
    });
    expect(screen.queryByText('Incompatible: no tool support')).toBeNull();
    // Selecting proceeds without the confirm step.
    fireEvent.click(screen.getByRole('checkbox', { name: 'C D' }));
    expect(screen.queryByText('Select anyway')).toBeNull();
  });
});

describe('ModelSection blast-radius preview (PRV-077 / PRV-081e)', () => {
  function seedPinned() {
    mockGrouped.rows = [
      groupedRow('a/b', {
        displayName: 'A B',
        providerDisplayName: 'A',
        pinnedBy: [{ assistant_id: 'asst-1', version: 2 }],
      }),
    ];
  }

  it('requires confirmation listing affected assistants before removing a pinned model', async () => {
    withFakeTimers();
    seedPinned();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Remove A B'));
    // Alert-class confirm (ConfirmDialog): affected list + pinning invariant.
    expect(screen.getByText('Remove model — 1 pinned assistant')).toBeTruthy();
    expect(screen.getByText('asst-1')).toBeTruthy();
    expect(screen.getByText('v2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove model' }));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_policy.allowed_models).toEqual([]);
    expect(input.definition.model_policy.pipeline).toEqual([]);
  });

  it('cancelling the blast-radius confirm keeps the pipeline', async () => {
    seedPinned();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Remove A B'));
    expect(screen.getByText('Remove model — 1 pinned assistant')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Keep enabled' }));
    expect(screen.queryByText('Remove model — 1 pinned assistant')).toBeNull();
    // The pipeline row is still there.
    expect(screen.getByLabelText('Remove A B')).toBeTruthy();
  });

  it('removes unpinned models without a confirm step', async () => {
    seedGrouped();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Remove A B'));
    expect(screen.queryByText(/pinned assistant/)).toBeNull();
  });
});

describe('ModelSection per-entry reasoning budget override (PRV-073)', () => {
  it('saves a per-entry budget override through the pipeline params', async () => {
    withFakeTimers();
    await act(async () => {
      shell({
        definition: {
          ...DEFINITION,
          model_policy: {
            allowed_models: ['a/b'],
            fallback_enabled: false,
            pipeline: [{ ref: 'a/b', params: { reasoning_budget_tokens: 8000 } }],
          },
        },
      });
    });
    // The override section auto-opens (hasOverride covers the budget) once
    // the row is expanded.
    fireEvent.click(screen.getByLabelText('Expand A B configuration'));
    expect(screen.getByDisplayValue('8,000')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Fallback'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_policy.pipeline?.[0]?.params?.reasoning_budget_tokens).toBe(8000);
  });
});
