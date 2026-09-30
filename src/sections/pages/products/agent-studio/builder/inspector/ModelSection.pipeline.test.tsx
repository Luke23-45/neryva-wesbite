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

type CatalogRow = {
  provider: string;
  modelId: string;
  ref: string;
  displayName: string;
  contextWindowTokens: null;
  maxOutputTokens: null;
  capabilities: Record<string, never>;
  residency: null;
  usable: boolean;
  reasons: string[];
  requiredProduct: string | null;
  requiredProductLabel: string | null;
};

// Two models that need a provider credential, so a missing credential blocks
// the save. No credential exists in the mocked vault.
const mockCatalog = vi.hoisted(() => {
  const rows: CatalogRow[] = [
    { provider: 'a', modelId: 'b', ref: 'a/b', displayName: 'A B', contextWindowTokens: null, maxOutputTokens: null, capabilities: {}, residency: null, usable: true, reasons: [], requiredProduct: null, requiredProductLabel: null },
    { provider: 'c', modelId: 'd', ref: 'c/d', displayName: 'C D', contextWindowTokens: null, maxOutputTokens: null, capabilities: {}, residency: null, usable: false, reasons: ['provider_credential_missing'], requiredProduct: null, requiredProductLabel: null },
  ];
  return { rows: rows as CatalogRow[] | undefined };
});

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return {
    ...actual,
    useModelAvailability: () => ({
      data: mockCatalog.rows,
      isPending: false,
      isFetching: false,
      isError: false,
    }),
    useModelCosts: () => ({ data: [], isPending: false, isFetching: false, isError: false }),
  };
});

vi.mock('@hooks/studio/useSetupProviders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupProviders')>();
  return {
    ...actual,
    useProviderCredentials: () => ({ data: [], isPending: false, isError: false }),
    useCreateProviderCredential: () => ({ mutate: vi.fn(), isPending: false }),
    useRotateProviderCredential: () => ({ mutate: vi.fn(), isPending: false }),
    useRevokeProviderCredential: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const DEFINITION: AgentDefinition = {
  ...defaultConsumer(),
  instructions: '## Role\nConcierge.\n',
  model_policy: { allowed_models: ['a/b'], fallback_enabled: false },
};

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
    // …then resolve its credential gate by giving it a credential is out of
    // scope here; instead assert the shape with a usable-only pipeline.
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

  it('holds the save when a pipeline model needs a vault credential — with the named message', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    // Add C D, whose catalog row reports provider_credential_missing and the
    // mocked vault holds no credential for provider "c".
    fireEvent.click(screen.getByLabelText(/C D — unusable/));
    // The blocker names the provider and the model.
    expect(screen.getByText(/No C credential in vault — required by C D\./)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
    // Removing the blocked model clears the blocker…
    fireEvent.click(screen.getByLabelText('Remove C D'));
    expect(screen.queryByText(/credential in vault/)).toBeNull();
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
