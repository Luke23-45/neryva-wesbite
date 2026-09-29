// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { BlockNewSection } from './BlockNewSection';
import { VersionImportSection, IMPORT_HIGHLIGHT_KEY } from './VersionImportSection';
import { RollbackSection, ROLLBACK_REVEALED_KEY } from './RollbackSection';
import { BLOCK_TARGETS } from '@hooks/studio/useSetupOperate';
import type { AgentVersion } from '@hooks/studio/useAgentAuthoring';

let mockRole: string = 'owner';
let mockAssistant: { data: unknown; isPending: boolean; isError: boolean } = {
  data: { id: 'agent-1', activeVersionId: 'v3' },
  isPending: false,
  isError: false,
};
let mockVersions: AgentVersion[] = [];
let mockNeedsAck = false;

const setBlockMutate = vi.fn();
let blockOpts: { onSuccess?: () => void } | undefined;
const rollbackMutate = vi.fn();
let rollbackInput: unknown;
let rollbackOpts: { onSuccess?: (ref: { version: number }) => void; onError?: (error: unknown) => void } | undefined;
const importMutate = vi.fn();
let importOpts: { onSuccess?: (result: unknown) => void; onError?: (error: unknown) => void } | undefined;

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

function query<T>(data: T) {
  return { data, isPending: false, isError: false, refetch: vi.fn() };
}

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistant: () => mockAssistant,
    useAssistantVersions: () => query(mockVersions),
    useRollbackAssistant: () => ({ mutate: rollbackMutate, isPending: false }),
    useImportVersion: () => ({ mutate: importMutate, isPending: false, error: null }),
    usePublishReadiness: () => ({ needsAcknowledge: mockNeedsAck }),
  };
});

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return {
    ...actual,
    useSetControlBlock: () => ({ mutate: setBlockMutate, isPending: false }),
  };
});

// The TanStack memory-history adapter implements history.block as a no-op,
// so the dirty-guard interception dialog cannot be exercised in jsdom. Mock
// the guard to assert the section's arming wiring instead.
vi.mock('@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard', () => ({
  useDirtyGuard: vi.fn(() => ({ dialog: null })),
}));

const KNOWN_ASSISTANT = {
  data: { id: 'agent-1', activeVersionId: 'v3' },
  isPending: false,
  isError: false,
};
const UNKNOWN_ASSISTANT = { data: null, isPending: false, isError: false };

function version(overrides: Partial<AgentVersion> & { id: string; version: number }): AgentVersion {
  return {
    status: 'PUBLISHED',
    hash: 'aabbccddeeff0011',
    createdAt: '2026-09-10T00:00:00Z',
    publishedAt: '2026-09-10T10:00:00Z',
    publishedBy: 'u1',
    rollbackOf: null,
    parentVersionId: null,
    updatedAt: null,
    definition: null,
    ...overrides,
  };
}

const PUBLISHED_VERSIONS: AgentVersion[] = [
  version({ id: 'v1', version: 1, publishedAt: '2026-09-10T10:00:00Z' }),
  version({ id: 'v2', version: 2, publishedAt: '2026-09-11T10:00:00Z' }),
  version({ id: 'v3', version: 3, publishedAt: '2026-09-12T10:00:00Z' }),
  version({ id: 'v4', version: 4, status: 'DRAFT', publishedAt: null }),
];

const ENVELOPE = JSON.stringify({
  schema_version: 2,
  instructions: 'You are helpful.',
  model_policy: { allowed_models: ['a/good'], fallback_enabled: false },
});

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function routerAt(initialPath: string, role = 'owner') {
  mockRole = role;
  const rootRoute = createRootRoute();
  const agentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/agents',
    component: () => <Outlet />,
  });
  const listRoute = createRoute({
    getParentRoute: () => agentsRoute,
    path: '/',
    component: () => shell(<div>agents list</div>),
  });
  const detailRoute = createRoute({
    getParentRoute: () => agentsRoute,
    path: '/$agentId',
    component: () => <Outlet />,
  });
  const detailIndexRoute = createRoute({
    getParentRoute: () => detailRoute,
    path: '/',
    component: () => shell(<div>agent detail</div>),
  });
  const blockRoute = createRoute({
    getParentRoute: () => detailRoute,
    path: '/block/new',
    component: () => shell(<BlockNewSection />),
  });
  const importRoute = createRoute({
    getParentRoute: () => detailRoute,
    path: '/versions/import',
    component: () => shell(<VersionImportSection />),
  });
  const rollbackRoute = createRoute({
    getParentRoute: () => detailRoute,
    path: '/versions/rollback',
    component: () => shell(<RollbackSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      agentsRoute.addChildren([
        listRoute,
        detailRoute.addChildren([detailIndexRoute, blockRoute, importRoute, rollbackRoute]),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  mockAssistant = KNOWN_ASSISTANT;
  mockVersions = [...PUBLISHED_VERSIONS];
  mockNeedsAck = false;
  setBlockMutate.mockReset();
  rollbackMutate.mockReset();
  importMutate.mockReset();
  setBlockMutate.mockImplementation((_input: unknown, opts?: { onSuccess?: () => void }) => {
    blockOpts = opts;
  });
  rollbackMutate.mockImplementation((input: unknown, opts?: typeof rollbackOpts) => {
    rollbackInput = input;
    rollbackOpts = opts;
  });
  importMutate.mockImplementation((_payload: unknown, opts?: typeof importOpts) => {
    importOpts = opts;
  });
  blockOpts = undefined;
  rollbackInput = undefined;
  rollbackOpts = undefined;
  importOpts = undefined;
  sessionStorage.clear();
  localStorage.clear();
});

const BLOCK_PATH = '/agent-studio/agents/agent-1/block/new';
const IMPORT_PATH = '/agent-studio/agents/agent-1/versions/import';
const ROLLBACK_PATH = '/agent-studio/agents/agent-1/versions/rollback';
const DETAIL_PATH = '/agent-studio/agents/agent-1';
const LIST_PATH = '/agent-studio/agents';

describe('governance-gate bounces', () => {
  it.each([
    [BLOCK_PATH, 'reader'],
    [BLOCK_PATH, 'developer'],
    [ROLLBACK_PATH, 'reader'],
    [ROLLBACK_PATH, 'developer'],
    [IMPORT_PATH, 'reader'],
  ])('bounces %s off %s to the agents list', async (path, role) => {
    const router = await routerAt(path, role);
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });

  it('renders nothing for the bounced role', async () => {
    await routerAt(BLOCK_PATH, 'reader');
    expect(screen.queryByText('Set control block')).toBeNull();
    expect(screen.queryByLabelText(/Reason \(mandatory/)).toBeNull();
    await routerAt(ROLLBACK_PATH, 'reader');
    expect(screen.queryByText('Roll back to a prior version')).toBeNull();
  });

  it('renders each section for an authorized role', async () => {
    await routerAt(BLOCK_PATH);
    expect(screen.getByText('Set control block')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Agent detail' })).toHaveProperty(
      'href',
      expect.stringContaining(DETAIL_PATH),
    );
  });

  it('renders the import section for a developer (setup:author)', async () => {
    await routerAt(IMPORT_PATH, 'developer');
    expect(screen.getByText('Import a definition')).toBeTruthy();
  });

  it('renders the rollback section for an admin', async () => {
    await routerAt(ROLLBACK_PATH, 'admin');
    expect(screen.getByText('Roll back to a prior version')).toBeTruthy();
  });
});

describe('unknown agent id bounce', () => {
  it.each([[BLOCK_PATH], [IMPORT_PATH], [ROLLBACK_PATH]])('bounces %s to the agents list', async (path) => {
    mockAssistant = UNKNOWN_ASSISTANT;
    const router = await routerAt(path);
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });

  it('bounces on a failed agent read too', async () => {
    mockAssistant = { data: undefined, isPending: false, isError: true };
    const router = await routerAt(BLOCK_PATH);
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByText('Set control block')).toBeNull();
  });
});

describe('block: two-step arming (danger semantics preserved)', () => {
  function fillReason() {
    fireEvent.change(screen.getByLabelText(/Reason \(mandatory/), { target: { value: 'incident-4821 — bad grounding' } });
  }

  it('requires two clicks for a permanent block — the first click only arms', async () => {
    const router = await routerAt(BLOCK_PATH);
    expect(router).toBeTruthy();
    fillReason();

    // First click arms, never commits.
    fireEvent.click(screen.getByText('Set block'));
    expect(setBlockMutate).not.toHaveBeenCalled();
    expect(screen.getByText('Yes — block with no expiry')).toBeTruthy();

    // Second click commits WITHOUT an expiry.
    fireEvent.click(screen.getByText('Yes — block with no expiry'));
    expect(setBlockMutate).toHaveBeenCalledTimes(1);
    expect(setBlockMutate).toHaveBeenCalledWith(
      { targetType: 'assistant', targetName: 'agent-1', reason: 'incident-4821 — bad grounding' },
      expect.anything(),
    );
    expect('expiresAt' in (setBlockMutate.mock.calls[0][0] as Record<string, unknown>)).toBe(false);
  });

  it('returns to the agent detail on success', async () => {
    const router = await routerAt(BLOCK_PATH);
    fillReason();
    fireEvent.click(screen.getByText('Set block'));
    fireEvent.click(screen.getByText('Yes — block with no expiry'));
    expect(blockOpts?.onSuccess).toBeTypeOf('function');
    await act(async () => {
      blockOpts?.onSuccess?.();
    });
    expect(router.state.location.pathname).toBe(DETAIL_PATH);
  });

  it('commits in one click when an expiry is set', async () => {
    await routerAt(BLOCK_PATH);
    fillReason();
    fireEvent.change(screen.getByLabelText(/Expires at/), { target: { value: '2030-01-01T00:00' } });
    fireEvent.click(screen.getByText('Set block'));
    expect(setBlockMutate).toHaveBeenCalledTimes(1);
    const input = setBlockMutate.mock.calls[0][0] as { expiresAt: string };
    expect(input.expiresAt).toBe(new Date('2030-01-01T00:00').toISOString());
    expect(screen.queryByText('Yes — block with no expiry')).toBeNull();
  });

  it('changing the expiry disarms the permanent flow', async () => {
    await routerAt(BLOCK_PATH);
    fillReason();
    fireEvent.click(screen.getByText('Set block'));
    expect(screen.getByText('Yes — block with no expiry')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Expires at/), { target: { value: '2030-06-01T00:00' } });
    expect(screen.queryByText('Yes — block with no expiry')).toBeNull();
    expect(screen.getByText('Set block')).toBeTruthy();
    expect(setBlockMutate).not.toHaveBeenCalled();
  });
});

describe('block: validation parity with the modal', () => {
  it('prefills the target name with the agent id', async () => {
    await routerAt(BLOCK_PATH);
    expect((screen.getByLabelText(/Target name/) as HTMLInputElement).value).toBe('agent-1');
  });

  it('offers the closed block-target vocabulary', async () => {
    await routerAt(BLOCK_PATH);
    const select = screen.getByLabelText('Target type') as HTMLSelectElement;
    const options = within(select).getAllByRole('option').map((o) => (o as HTMLOptionElement).value);
    expect(options).toEqual([...BLOCK_TARGETS]);
    expect(select.value).toBe('assistant');
  });

  it('keeps Set block disabled until the reason is present', async () => {
    await routerAt(BLOCK_PATH);
    const setBlock = screen.getByText('Set block').closest('button')!;
    expect(setBlock).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText(/Reason \(mandatory/), { target: { value: 'freeze' } });
    expect(setBlock).toHaveProperty('disabled', false);
  });

  it('rejects empty and overlong target names', async () => {
    await routerAt(BLOCK_PATH);
    fireEvent.change(screen.getByLabelText(/Reason \(mandatory/), { target: { value: 'freeze' } });
    const setBlock = screen.getByText('Set block').closest('button')!;
    fireEvent.change(screen.getByLabelText(/Target name/), { target: { value: '' } });
    expect(screen.getByText('Target names are 1–128 chars.')).toBeTruthy();
    expect(setBlock).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText(/Target name/), { target: { value: 'x'.repeat(129) } });
    expect(screen.getByText('Target names are 1–128 chars.')).toBeTruthy();
    expect(setBlock).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText(/Target name/), { target: { value: 'ok-name' } });
    expect(screen.queryByText('Target names are 1–128 chars.')).toBeNull();
    expect(setBlock).toHaveProperty('disabled', false);
  });

  it('rejects an overlong reason', async () => {
    await routerAt(BLOCK_PATH);
    fireEvent.change(screen.getByLabelText(/Reason \(mandatory/), { target: { value: 'x'.repeat(513) } });
    expect(screen.getByText('Operator justification is mandatory (1–512 chars).')).toBeTruthy();
    expect(screen.getByText('Set block').closest('button')).toHaveProperty('disabled', true);
  });

  it('rejects a past expiry', async () => {
    await routerAt(BLOCK_PATH);
    fireEvent.change(screen.getByLabelText(/Reason \(mandatory/), { target: { value: 'freeze' } });
    fireEvent.change(screen.getByLabelText(/Expires at/), { target: { value: '2020-01-01T00:00' } });
    expect(screen.getByText('Expiry must be in the future.')).toBeTruthy();
    expect(screen.getByText('Set block').closest('button')).toHaveProperty('disabled', true);
  });

  it('Cancel on a pristine form returns to the agent detail', async () => {
    const router = await routerAt(BLOCK_PATH);
    fireEvent.click(screen.getByText('Cancel'));
    expect(router.state.location.pathname).toBe(DETAIL_PATH);
  });

  it('arms the leave guard from form dirtiness (interception itself is browser-verified)', async () => {
    // @tanstack/history's memory adapter implements history.block as a
    // no-op, so the blocker's interception dialog cannot be exercised in
    // jsdom. What the section controls — arming useDirtyGuard from form
    // state — is asserted here via the mocked hook. The interception path
    // uses the established useDirtyGuard builder pattern.
    const { useDirtyGuard } = await import(
      '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard'
    );
    const guardMock = vi.mocked(useDirtyGuard);
    guardMock.mockClear();
    await routerAt(BLOCK_PATH);
    // Pristine form: guard disarmed.
    expect(guardMock).toHaveBeenLastCalledWith(false, expect.any(String));
    fireEvent.change(screen.getByLabelText(/Reason \(mandatory/), { target: { value: 'unsent' } });
    // Dirty form: guard armed.
    expect(guardMock).toHaveBeenLastCalledWith(true, expect.any(String));
  });
});

describe('rollback section', () => {
  it('lists rollback candidates newest-first, excluding the live version and drafts', async () => {
    await routerAt(ROLLBACK_PATH);
    const select = screen.getByLabelText('Restore') as HTMLSelectElement;
    const options = within(select).getAllByRole('option');
    expect(options.map((o) => (o as HTMLOptionElement).value)).toEqual(['v2', 'v1']);
    expect(options[0].textContent).toContain('v2');
    expect(options[0].textContent).toContain('2026-09-11 10:00');
  });

  it('shows the empty note and no danger button when there is nothing to roll back to', async () => {
    mockVersions = [version({ id: 'v4', version: 4, status: 'DRAFT', publishedAt: null })];
    mockAssistant = { data: { id: 'agent-1', activeVersionId: null }, isPending: false, isError: false };
    await routerAt(ROLLBACK_PATH);
    expect(screen.getByText('Nothing to roll back to — publish at least two versions first.')).toBeTruthy();
    expect(screen.queryByText(/Roll back to v/)).toBeNull();
    expect(screen.getByText('Close')).toBeTruthy();
  });

  it('keeps the rollback-creates-new-version copy verbatim', async () => {
    await routerAt(ROLLBACK_PATH);
    expect(screen.getByText(/Rollback births a new version — history is kept/)).toBeTruthy();
    expect(screen.getByText(/In-flight runs stay pinned/)).toBeTruthy();
  });

  it('submits the typed payload for the selected target', async () => {
    await routerAt(ROLLBACK_PATH);
    fireEvent.click(screen.getByText('Roll back to v2'));
    expect(rollbackMutate).toHaveBeenCalledTimes(1);
    expect(rollbackInput).toEqual({ toVersionId: 'v2' });
  });

  it('sends the degraded-knowledge ack only when the box is armed', async () => {
    mockNeedsAck = true;
    await routerAt(ROLLBACK_PATH);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(screen.getByText(/Ship degraded: publish with unresolved knowledge/)).toBeTruthy();
    fireEvent.click(box);
    fireEvent.click(screen.getByText('Roll back to v2'));
    expect(rollbackInput).toEqual({ toVersionId: 'v2', acknowledgeDegradedKnowledge: true });
  });

  it('shows the refusal alert on error and writes no marker', async () => {
    await routerAt(ROLLBACK_PATH);
    fireEvent.click(screen.getByText('Roll back to v2'));
    await act(async () => {
      rollbackOpts?.onError?.(new Error('engine says no'));
    });
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Rollback refused');
    expect(alert.textContent).toContain('engine says no');
    expect(sessionStorage.getItem(ROLLBACK_REVEALED_KEY('agent-1'))).toBeNull();
    expect(screen.queryByText(/Live is now v/)).toBeNull();
  });

  it('writes the reveal marker on success and shows the live receipt', async () => {
    await routerAt(ROLLBACK_PATH);
    fireEvent.click(screen.getByText('Roll back to v2'));
    await act(async () => {
      rollbackOpts?.onSuccess?.({ version: 7 });
    });
    expect(sessionStorage.getItem(ROLLBACK_REVEALED_KEY('agent-1'))).toBe('7');
    expect(screen.getByText(/Live is now v7/)).toBeTruthy();
    expect(screen.getByText(/Recorded in Audit/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Open Audit/ })).toHaveProperty(
      'href',
      expect.stringContaining('/platform/audit'),
    );
  });

  it('a refresh shows the explicit already-revealed notice, not a stale receipt', async () => {
    const first = await routerAt(ROLLBACK_PATH);
    fireEvent.click(screen.getByText('Roll back to v2'));
    await act(async () => {
      rollbackOpts?.onSuccess?.({ version: 7 });
    });
    expect(first.state.location.pathname).toBe(ROLLBACK_PATH);

    // Fresh mount = refresh: a real refresh destroys the old tree, so unmount
    // it before remounting. The marker is read, the receipt is not replayed.
    cleanup();
    await routerAt(ROLLBACK_PATH);
    expect(screen.getByText(/Already revealed/)).toBeTruthy();
    expect(screen.getByText(/recorded earlier in this browser session/)).toBeTruthy();
    expect(screen.queryByText('Live is now v7')).toBeNull();
    expect(screen.getByRole('link', { name: /Open Audit/ })).toBeTruthy();
  });

  it('Done clears the marker and returns to the agent detail', async () => {
    const router = await routerAt(ROLLBACK_PATH);
    fireEvent.click(screen.getByText('Roll back to v2'));
    await act(async () => {
      rollbackOpts?.onSuccess?.({ version: 7 });
    });
    expect(sessionStorage.getItem(ROLLBACK_REVEALED_KEY('agent-1'))).toBe('7');
    fireEvent.click(screen.getByText('Close'));
    expect(sessionStorage.getItem(ROLLBACK_REVEALED_KEY('agent-1'))).toBeNull();
    expect(router.state.location.pathname).toBe(DETAIL_PATH);
  });

  it('Close without a rollback leaves no marker behind', async () => {
    const router = await routerAt(ROLLBACK_PATH);
    fireEvent.click(screen.getByText('Close'));
    expect(sessionStorage.getItem(ROLLBACK_REVEALED_KEY('agent-1'))).toBeNull();
    expect(router.state.location.pathname).toBe(DETAIL_PATH);
  });
});

describe('import section', () => {
  it('embeds the import pane copy verbatim', async () => {
    await routerAt(IMPORT_PATH);
    expect(screen.getByText('Import a definition')).toBeTruthy();
    expect(screen.getByLabelText(/Exported definition JSON/)).toBeTruthy();
    expect(screen.getByText('Import as draft')).toBeTruthy();
  });

  it('auto-navigates to the agent detail with a highlight marker on success', async () => {
    const router = await routerAt(IMPORT_PATH);
    fireEvent.change(screen.getByLabelText(/Exported definition JSON/), { target: { value: ENVELOPE } });
    fireEvent.click(screen.getByText('Import as draft'));
    expect(importMutate).toHaveBeenCalledTimes(1);
    await act(async () => {
      importOpts?.onSuccess?.({ version: { id: 'v9' } });
    });
    expect(sessionStorage.getItem(IMPORT_HIGHLIGHT_KEY('agent-1'))).toBe('v9');
    expect(router.state.location.pathname).toBe(DETAIL_PATH);
  });

  it('a null version id still navigates, without a marker', async () => {
    const router = await routerAt(IMPORT_PATH);
    fireEvent.change(screen.getByLabelText(/Exported definition JSON/), { target: { value: ENVELOPE } });
    fireEvent.click(screen.getByText('Import as draft'));
    await act(async () => {
      importOpts?.onSuccess?.({ version: {} });
    });
    expect(sessionStorage.getItem(IMPORT_HIGHLIGHT_KEY('agent-1'))).toBeNull();
    expect(router.state.location.pathname).toBe(DETAIL_PATH);
  });
});
