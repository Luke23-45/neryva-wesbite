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
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { ImportPane } from './ImportPane';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const importMutate = vi.fn();
const createMutate = vi.fn();

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useImportVersion: () => ({ mutate: importMutate, isPending: false, error: null }),
    useCreateAssistant: () => ({ mutate: createMutate, isPending: false, error: null }),
  };
});

const ENVELOPE = JSON.stringify({
  schema_version: 2,
  instructions: 'You are helpful.',
  model_policy: { allowed_models: ['a/good'], fallback_enabled: false },
});

async function shell(props?: Partial<React.ComponentProps<typeof ImportPane>>) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <ImportPane assistantId="agent-1" onImported={() => undefined} {...props} />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

beforeEach(() => {
  importMutate.mockReset();
  createMutate.mockReset();
});

describe('ImportPane (client-first, errors block, warnings ride)', () => {
  it('rejects syntax errors without toasts or sends', async () => {
    await shell();
    fireEvent.change(screen.getByLabelText(/Exported definition JSON/), { target: { value: '{nope' } });
    expect(screen.getByText(/valid JSON/)).toBeTruthy();
    expect(screen.getByTitle(/Fix the errors/)).toBeDisabled();
    expect(importMutate).not.toHaveBeenCalled();
  });

  it('unwraps .export files and shows the schema line', async () => {
    await shell();
    fireEvent.change(
      screen.getByLabelText(/Exported definition JSON/),
      { target: { value: JSON.stringify({ export: JSON.parse(ENVELOPE), provenance: { seed: 1 } }) } },
    );
    expect(screen.getByText(/schema_version 2/)).toBeTruthy();
    expect(screen.getByText(/Unwrapped .export/)).toBeTruthy();
    fireEvent.click(screen.getByText('Import as draft'));
    const sent = importMutate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(sent).not.toHaveProperty('export');
    expect(sent).not.toHaveProperty('provenance');
    expect(sent).toMatchObject({ instructions: 'You are helpful.' });
  });

  it('lists dotted-path errors and blocks send until fixed', async () => {
    await shell();
    fireEvent.change(
      screen.getByLabelText(/Exported definition JSON/),
      { target: { value: JSON.stringify({ schema_version: 2, instructions: 'Hi', model_policy: { allowed_models: [], fallback_enabled: false } }) } },
    );
    expect(screen.getByText(/1 ERROR/)).toBeTruthy();
    expect(screen.getByText(/model_policy.allowed_models/)).toBeTruthy();
    expect(screen.getByTitle(/Fix the errors/)).toBeDisabled();
  });

  it('warns on newer schemas without blocking (engine neither migrates nor refuses)', async () => {
    await shell();
    fireEvent.change(
      screen.getByLabelText(/Exported definition JSON/),
      { target: { value: JSON.stringify({ schema_version: 3, instructions: 'Hi', model_policy: { allowed_models: ['a/good'], fallback_enabled: false } }) } },
    );
    expect(screen.getByText(/newer schema/)).toBeTruthy();
    expect(screen.getByTitle(/Import as a draft version/)).toBeEnabled();
  });

  it('resolves identity in new-mode and creates via the single path', async () => {
    const onImported = vi.fn();
    await shell({ assistantId: null, onImported });
    fireEvent.change(screen.getByLabelText(/Exported definition JSON/), { target: { value: ENVELOPE } });
    fireEvent.change(screen.getByLabelText(/New agent name/), { target: { value: 'Imported Helper' } });
    fireEvent.click(screen.getByText('Import as draft'));
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Imported Helper' }),
      expect.anything(),
    );
  });

  it('reads files from disk, not just paste', async () => {
    await shell();
    fireEvent.click(screen.getByText('File', { selector: 'button' }));
    expect(screen.getByText(/Drop a .json export/)).toBeTruthy();
  });
});
