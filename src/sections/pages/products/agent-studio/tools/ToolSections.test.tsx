// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
import { ToolNewSection } from './ToolNewSection';
import { ToolEditSection } from './ToolEditSection';
import type { ToolCatalogEntry } from '@hooks/studio/useSetupTools';
import { TOOL_EFFECT_CLASSES, TOOL_APPROVAL_REQUIREMENTS } from '@hooks/studio/useSetupTools';

let mockRole: string = 'owner';
let mockCatalog: ToolCatalogEntry[] = [];

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

const upsertMutate = vi.fn();

vi.mock('@hooks/studio/useSetupTools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTools')>();
  return {
    ...actual,
    useToolCatalog: () => ({
      data: mockCatalog,
      isPending: false,
      isFetching: false,
      isError: false,
    }),
    useUpsertTool: () => ({
      mutate: (input: unknown, opts?: { onSuccess?: () => void }) => {
        upsertMutate(input, opts);
      },
      isPending: false,
    }),
  };
});

function toolEntry(overrides: Partial<ToolCatalogEntry> = {}): ToolCatalogEntry {
  return {
    id: 't1',
    name: 'lookup_ticket',
    version: 'v3',
    description: 'Ticket lookup',
    effectClass: 'READ_ONLY',
    approvalRequirement: 'NONE',
    hash: 'a'.repeat(64),
    enabled: true,
    executionEnvironment: 'sandboxed_microvm',
    allowedEgressDomains: ['api.crm.example'],
    bindingHost: 'api.crm.example',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: { type: 'string' },
    rateLimitPerRun: 5,
    annotations: { team: 'support' },
    ...overrides,
  };
}

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
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/tools',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<div>tools list</div>),
  });
  const newRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/new',
    component: () => shell(<ToolNewSection />),
  });
  const editRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/$toolId/edit',
    component: () => shell(<ToolEditSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, newRoute, editRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  mockCatalog = [toolEntry()];
  upsertMutate.mockClear();
  sessionStorage.clear();
  localStorage.clear();
});

const NAME_LABEL = 'Name (path-authoritative, lowercased)';
const ENDPOINT_LABEL = 'Endpoint URL (optional — https)';
const CREDENTIAL_LABEL = 'Credential (optional — sealed per-tool, never returned)';
const RATE_PLACEHOLDER = 'unset = platform cap';
const SCHEMA_LABEL = 'Input schema (JSON Schema object)';

function saveButton() {
  return screen.getByText('Save tool').closest('button')!;
}

describe('tool section role-gate bounces (setup:author)', () => {
  it.each([
    ['/agent-studio/tools/new'],
    ['/agent-studio/tools/lookup_ticket/edit'],
  ])('bounces a reader off %s to the tools list', async (path) => {
    const router = await routerAt(path, 'reader');
    expect(router.state.location.pathname).toBe('/agent-studio/tools');
  });

  it('renders nothing for the bounced role', async () => {
    await routerAt('/agent-studio/tools/new', 'reader');
    expect(screen.queryByText('Register a tool')).toBeNull();
    expect(screen.queryByLabelText(NAME_LABEL)).toBeNull();
  });

  it('renders the register form for a developer (setup:author includes developer)', async () => {
    await routerAt('/agent-studio/tools/new', 'developer');
    expect(screen.getByText('Register a tool')).toBeTruthy();
    expect(screen.getByLabelText(NAME_LABEL)).toBeTruthy();
  });

  it('renders the edit form for an admin', async () => {
    await routerAt('/agent-studio/tools/lookup_ticket/edit', 'admin');
    expect(screen.getByText('Edit tool lookup_ticket')).toBeTruthy();
  });
});

describe('ToolNewSection authorized render', () => {
  it('renders the register form with create-only fields', async () => {
    await routerAt('/agent-studio/tools/new');
    expect(screen.getByText('Register a tool')).toBeTruthy();
    expect(screen.getByLabelText(NAME_LABEL)).toBeTruthy();
    expect(screen.getByLabelText('Version (bump on breaking schema changes)')).toBeTruthy();
    expect(screen.getByLabelText('Description (optional, ≤2048)')).toBeTruthy();
    expect(screen.getByLabelText(ENDPOINT_LABEL)).toBeTruthy();
    expect(screen.getByLabelText(CREDENTIAL_LABEL)).toBeTruthy();
    expect(screen.getByPlaceholderText(RATE_PLACEHOLDER)).toBeTruthy();
    expect(screen.getByLabelText(SCHEMA_LABEL)).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(saveButton()).toBeTruthy();
    // Back row: ‹ Tools (the chevron is aria-hidden, so the name is "Tools")
    expect(screen.getByRole('link', { name: 'Tools' })).toHaveProperty(
      'href',
      expect.stringContaining('/agent-studio/tools'),
    );
  });

  it('offers the closed effect/approval vocabularies with the modal defaults', async () => {
    await routerAt('/agent-studio/tools/new');
    const effect = screen.getByLabelText('Effect class') as HTMLSelectElement;
    expect(Array.from(effect.options).map((o) => o.value)).toEqual([...TOOL_EFFECT_CLASSES]);
    expect(effect.value).toBe('READ_ONLY');
    const approval = screen.getByLabelText('Approval requirement') as HTMLSelectElement;
    expect(Array.from(approval.options).map((o) => o.value)).toEqual([...TOOL_APPROVAL_REQUIREMENTS]);
    expect(approval.value).toBe('NONE');
  });

  it('warns on a colliding name (A4-66 upsert advisory)', async () => {
    await routerAt('/agent-studio/tools/new');
    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: 'lookup_ticket' } });
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/already exists — saving replaces its schema/)).toBeTruthy();
  });
});

describe('ToolEditSection authorized render', () => {
  it('renders edit mode prefilled with the name locked and no create-only fields', async () => {
    await routerAt('/agent-studio/tools/lookup_ticket/edit');
    expect(screen.getByText('Edit tool lookup_ticket')).toBeTruthy();
    const nameInput = screen.getByPlaceholderText('lookup_ticket') as HTMLInputElement;
    expect(nameInput.value).toBe('lookup_ticket');
    expect(nameInput.disabled).toBe(true);
    expect((screen.getByPlaceholderText('1.0.0') as HTMLInputElement).value).toBe('v3');
    // Create-only inputs are absent on edit (endpoint + credential).
    expect(screen.queryByLabelText(ENDPOINT_LABEL)).toBeNull();
    expect(screen.queryByLabelText(CREDENTIAL_LABEL)).toBeNull();
    // The edit-only preserved-fields note.
    expect(screen.getByText(/preserved as-is — this form cannot change them/)).toBeTruthy();
    // Stored rate limit prefills with the unchanged-on-clear note.
    expect((screen.getByPlaceholderText(RATE_PLACEHOLDER) as HTMLInputElement).value).toBe('5');
    expect(screen.getByText(/Currently 5\/run — clearing the field leaves the stored limit unchanged/)).toBeTruthy();
  });

  it('bounces an unknown tool id to the tools list', async () => {
    const router = await routerAt('/agent-studio/tools/nope/edit');
    expect(router.state.location.pathname).toBe('/agent-studio/tools');
    expect(screen.queryByText(/Edit tool/)).toBeNull();
    expect(screen.queryByLabelText(NAME_LABEL)).toBeNull();
  });
});

describe('validation parity with the old modal', () => {
  it('keeps Save disabled until the name is valid', async () => {
    await routerAt('/agent-studio/tools/new');
    expect(saveButton()).toHaveProperty('disabled', true);
    expect(screen.getByText('Name is required.')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: '1bad' } });
    expect(screen.getByText(/Must match \^\[a-z\]\[a-z0-9_\]\{1,63\}\$/)).toBeTruthy();
    expect(saveButton()).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: 'fresh_tool' } });
    expect(screen.queryByText('Name is required.')).toBeNull();
    expect(screen.queryByText(/Must match/)).toBeNull();
    expect(saveButton()).toHaveProperty('disabled', false);
  });

  it('rejects a non-https endpoint URL on create', async () => {
    await routerAt('/agent-studio/tools/new');
    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: 'fresh_tool' } });
    fireEvent.change(screen.getByPlaceholderText('https://…'), { target: { value: 'http://insecure.example/hook' } });
    expect(screen.getByText('Must be an https URL.')).toBeTruthy();
    expect(saveButton()).toHaveProperty('disabled', true);
  });

  it('rejects invalid and non-object input schemas', async () => {
    await routerAt('/agent-studio/tools/new');
    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: 'fresh_tool' } });
    fireEvent.change(screen.getByLabelText(SCHEMA_LABEL), { target: { value: '{oops' } });
    expect(screen.getByText('Must be valid JSON.')).toBeTruthy();
    expect(saveButton()).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByLabelText(SCHEMA_LABEL), { target: { value: '[1, 2]' } });
    expect(screen.getByText('Must be a JSON Schema object.')).toBeTruthy();
    expect(saveButton()).toHaveProperty('disabled', true);
  });

  it('blocks save when the rate limit is below 1', async () => {
    await routerAt('/agent-studio/tools/new');
    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: 'fresh_tool' } });
    fireEvent.change(screen.getByPlaceholderText(RATE_PLACEHOLDER), { target: { value: '0' } });
    expect(screen.getByText('Must be a number ≥ 1.')).toBeTruthy();
    expect(saveButton()).toHaveProperty('disabled', true);
  });
});

describe('create save payload (byte-identical to the modal)', () => {
  it('sends the normalized name, endpoint, credential, and rate limit, then returns to the list', async () => {
    const router = await routerAt('/agent-studio/tools/new');
    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: 'Fresh_Tool' } });
    fireEvent.change(screen.getByLabelText('Version (bump on breaking schema changes)'), { target: { value: '2.0.0' } });
    fireEvent.change(screen.getByLabelText('Description (optional, ≤2048)'), { target: { value: 'Does things' } });
    fireEvent.change(screen.getByPlaceholderText('https://…'), { target: { value: 'https://api.example.com/hook' } });
    fireEvent.change(screen.getByLabelText(CREDENTIAL_LABEL), { target: { value: 's3cr3t-value-99' } });
    fireEvent.change(screen.getByLabelText('Effect class'), { target: { value: 'MUTATING' } });
    fireEvent.change(screen.getByLabelText('Approval requirement'), { target: { value: 'REQUIRED' } });
    fireEvent.change(screen.getByPlaceholderText(RATE_PLACEHOLDER), { target: { value: '25' } });
    fireEvent.click(saveButton());

    expect(upsertMutate).toHaveBeenCalledTimes(1);
    expect(upsertMutate.mock.calls[0][0]).toMatchObject({
      name: 'fresh_tool',
      effectClass: 'MUTATING',
      approvalRequirement: 'REQUIRED',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      version: '2.0.0',
      description: 'Does things',
      httpBindingUrl: 'https://api.example.com/hook',
      credential: 's3cr3t-value-99',
      rateLimitPerRun: 25,
    });

    // The modal closed on success; the section navigates to the tools list.
    act(() => {
      upsertMutate.mock.calls[0][1].onSuccess();
    });
    expect(router.state.location.pathname).toBe('/agent-studio/tools');
  });

  it('omits rateLimitPerRun when left blank on create', async () => {
    await routerAt('/agent-studio/tools/new');
    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: 'fresh_tool' } });
    fireEvent.click(saveButton());
    expect(upsertMutate).toHaveBeenCalledTimes(1);
    expect(upsertMutate.mock.calls[0][0]).not.toHaveProperty('rateLimitPerRun');
  });
});

describe('edit save payload (byte-identical to the modal)', () => {
  it('round-trips the non-rendered fields and never resends endpoint/credential', async () => {
    await routerAt('/agent-studio/tools/lookup_ticket/edit');
    fireEvent.click(saveButton());

    expect(upsertMutate).toHaveBeenCalledTimes(1);
    const payload = upsertMutate.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: 'lookup_ticket',
      version: 'v3',
      description: 'Ticket lookup',
      effectClass: 'READ_ONLY',
      approvalRequirement: 'NONE',
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'string' },
      executionEnvironment: 'sandboxed_microvm',
      allowedEgressDomains: ['api.crm.example'],
      annotations: { team: 'support' },
      rateLimitPerRun: 5,
    });
    expect(payload).not.toHaveProperty('httpBindingUrl');
    expect(payload).not.toHaveProperty('credential');
  });

  it('keeps the current version when the version field is cleared', async () => {
    await routerAt('/agent-studio/tools/lookup_ticket/edit');
    fireEvent.change(screen.getByPlaceholderText('1.0.0'), { target: { value: '' } });
    fireEvent.click(saveButton());
    expect(upsertMutate).toHaveBeenCalledTimes(1);
    expect(upsertMutate.mock.calls[0][0]).toMatchObject({ version: 'v3' });
  });

  it('saves an edited rate limit', async () => {
    await routerAt('/agent-studio/tools/lookup_ticket/edit');
    fireEvent.change(screen.getByPlaceholderText(RATE_PLACEHOLDER), { target: { value: '10' } });
    fireEvent.click(saveButton());
    expect(upsertMutate).toHaveBeenCalledTimes(1);
    expect(upsertMutate.mock.calls[0][0]).toMatchObject({ name: 'lookup_ticket', rateLimitPerRun: 10 });
  });

  it('navigates back to the tools list on success', async () => {
    const router = await routerAt('/agent-studio/tools/lookup_ticket/edit');
    fireEvent.click(saveButton());
    act(() => {
      upsertMutate.mock.calls[0][1].onSuccess();
    });
    expect(router.state.location.pathname).toBe('/agent-studio/tools');
  });
});

describe('credential hygiene (write-only, never revealed)', () => {
  it('keeps the create-only credential out of the URL and web storage', async () => {
    const router = await routerAt('/agent-studio/tools/new');
    fireEvent.change(screen.getByPlaceholderText('lookup_ticket'), { target: { value: 'fresh_tool' } });
    fireEvent.change(screen.getByLabelText(CREDENTIAL_LABEL), { target: { value: 's3cr3t-value-99' } });
    fireEvent.click(saveButton());

    // The server seals the credential and never returns it — there is no
    // shown-once reveal, so nothing may persist client-side either.
    expect(router.state.location.href).not.toContain('s3cr3t-value-99');
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });
});
