// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { AgentBuilder } from './AgentBuilder';
import { useBuilderUI } from './lib/builder-store';
import { BuilderTopbarSlotsProvider, useBuilderTopbarSlots } from './topbar/BuilderTopbarSlots';

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
    // The topbar renders a router Link (editPath is a real path in build mode).
    // Stand it in for a plain anchor — routing is out of scope for save tests.
    Link: ({ children, to }: { children?: ReactNode; to?: string }) => <a href={to ?? '#'}>{children}</a>,
  };
});

vi.mock('@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard', () => ({
  useDirtyGuard: () => ({ dialog: null }),
}));

// The canvas is irrelevant to the save path — keep the heavy flow lib out of jsdom.
vi.mock('./canvas/AgentCanvas', () => ({
  AgentCanvas: () => null,
}));

vi.mock('../templates/TemplateBanner', () => ({
  // Rendered inside AgentBuilder's tree in build mode — stand in for
  // StudioShell by mounting the real actions slot, so the Save button
  // under test is the production one wired to the real save path. The
  // layout-level provider (AgentStudioShellPage in production) sits above.
  TemplateBanner: () => <TopbarSlotStandIn />,
}));

function TopbarSlotStandIn() {
  const slots = useBuilderTopbarSlots();
  return <>{slots?.actions}</>;
}

const DEFINITION = {
  ...defaultConsumer(),
  instructions: '## Role\nR.\n',
  model_policy: { allowed_models: ['a/b'], fallback_enabled: false },
};

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistant: () => ({ data: { name: 'Test agent', activeVersionId: null }, isFetching: false }),
    useAssistantDefinition: () => ({
      data: { definition: DEFINITION, versionId: 'v9', hash: 'h2', status: 'DRAFT', isDraft: true },
      isPending: false,
      isFetching: false,
      isError: false,
    }),
    useAssistantVersions: () => ({ data: [] }),
    useKnowledgeHealth: () => ({ data: undefined }),
    usePublishReadiness: () => ({ rows: [], verdict: 'unknown', isPending: false }),
    useSaveDraftVersion: () => ({ mutate: saveMutate, isPending: false }),
    useUpdateDraftVersion: () => ({ mutate: updateMutate, isPending: false }),
  };
});

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return {
    ...actual,
    useModelAvailability: () => ({
      data: [
        {
          provider: 'a',
          modelId: 'b',
          ref: 'a/b',
          displayName: 'A B',
          contextWindowTokens: null,
          maxOutputTokens: null,
          capabilities: {},
          residency: null,
          usable: true,
          reasons: [],
        },
      ],
      isPending: false,
      isFetching: false,
      isError: false,
    }),
  };
});

vi.mock('@hooks/studio/useSetupEval', () => ({
  useEvalRuns: () => ({ data: [] }),
}));

vi.mock('@hooks/studio/useSetupKnowledge', () => ({
  useDocuments: () => ({ data: [], isFetching: false }),
}));

vi.mock('@hooks/studio/useSetupTools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTools')>();
  return { ...actual, useToolCatalog: () => ({ data: [] }) };
});

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return { ...actual, useIsMutating: () => 0 };
});

function shell() {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <BuilderTopbarSlotsProvider>
          <AgentBuilder mode="build" agentId="agent-1" initialSlot="model" />
        </BuilderTopbarSlotsProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

function ctrlS(): KeyboardEvent {
  const ev = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true });
  window.dispatchEvent(ev);
  return ev;
}

describe('AgentBuilder manual save', () => {
  beforeEach(() => {
    saveMutate.mockReset();
    updateMutate.mockReset();
  });

  it('Ctrl+S preventDefaults and saves the dirty section exactly once', async () => {
    await act(async () => {
      shell();
    });
    // Model is mounted via initialSlot — flip Fallback to make it dirty.
    fireEvent.click(await screen.findByLabelText('Fallback'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled());
    saveMutate.mockClear();
    updateMutate.mockClear();

    const ev = ctrlS();
    expect(ev.defaultPrevented).toBe(true);
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const input = updateMutate.mock.calls[0][0] as { expectedHash: string };
    expect(input.expectedHash).toBe('h2');
  });

  it('Ctrl+S is a no-op when nothing is dirty', async () => {
    await act(async () => {
      shell();
    });
    await screen.findByLabelText('Fallback');

    const ev = ctrlS();
    expect(ev.defaultPrevented).toBe(true);
    expect(updateMutate).not.toHaveBeenCalled();
    expect(saveMutate).not.toHaveBeenCalled();
  });

  it('topbar Save button is disabled until a section goes dirty, then fires the save', async () => {
    await act(async () => {
      shell();
    });
    const btn = screen.getByRole('button', { name: 'Save changes' });
    expect(btn).toBeDisabled();

    fireEvent.click(await screen.findByLabelText('Fallback'));
    await waitFor(() => expect(btn).toBeEnabled());
    saveMutate.mockClear();
    updateMutate.mockClear();

    fireEvent.click(btn);
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
  });
});

describe('AgentBuilder manual save (roleDirty regression)', () => {
  beforeEach(() => {
    saveMutate.mockReset();
    updateMutate.mockReset();
    // The selection lives in a module-level zustand store — a previous
    // test's selection would otherwise suppress initialSlot handling.
    useBuilderUI.getState().hydrate(null);
  });

  it('topbar Save fires when ONLY the Role section is dirty', async () => {
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <BuilderTopbarSlotsProvider>
              <AgentBuilder mode="build" agentId="agent-1" initialSlot="role" />
            </BuilderTopbarSlotsProvider>
          </QueryClientProvider>
        </ThemeProvider>,
      );
    });
    const btn = screen.getByRole('button', { name: 'Save changes' });
    expect(btn).toBeDisabled();

    // Role is the only dirty section — the save signal must still reach it.
    fireEvent.change(await screen.findByLabelText('Role'), { target: { value: 'Support lead' } });
    await waitFor(() => expect(btn).toBeEnabled());
    saveMutate.mockClear();
    updateMutate.mockClear();

    fireEvent.click(btn);
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const input = updateMutate.mock.calls[0][0] as { definition: { role?: { role?: { content: string } } } };
    expect(input.definition.role?.role?.content).toBe('Support lead');
  });
});

describe('AgentBuilder Escape key', () => {
  beforeEach(() => {
    // The selection lives in a module-level zustand store — a previous
    // test's selection would otherwise suppress initialSlot handling.
    useBuilderUI.getState().hydrate(null);
  });

  function guardrailsShell() {
    return render(
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <BuilderTopbarSlotsProvider>
            <AgentBuilder mode="build" agentId="agent-1" initialSlot="guardrails" />
          </BuilderTopbarSlotsProvider>
        </QueryClientProvider>
      </ThemeProvider>,
    );
  }

  it('Escape inside a text input keeps focus and never navigates to Overview', async () => {
    await act(async () => {
      guardrailsShell();
    });
    const input = (await screen.findByLabelText('New deny topic')) as HTMLElement;
    input.focus();
    fireEvent.keyDown(input, { key: 'Escape', bubbles: true });
    // Focus stays in the field; the section view is untouched.
    expect(document.activeElement).toBe(input);
    expect(screen.getByLabelText('New deny topic')).toBeTruthy();
  });

  it('Escape outside a field still returns to Overview', async () => {
    await act(async () => {
      guardrailsShell();
    });
    await screen.findByLabelText('New deny topic');
    fireEvent.keyDown(document.body, { key: 'Escape', bubbles: true });
    // The builder navigated away — the guardrails view unmounted.
    await waitFor(() => expect(screen.queryByLabelText('New deny topic')).toBeNull());
  });
});
