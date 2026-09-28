// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { BuilderInspector, type InspectorContext } from './BuilderInspector';
import type { BuilderNode } from '../lib/projector';
import { laneOf, type LaneNodeId } from '../lib/lane-model';
import type { PurposeNodeDatum } from './PurposeExtras';

/**
 * Mapping tests (LEDGER.md §4 I1–I7): the 17 fixed node ids each mount
 * their section. Sections are stubbed — the mapping is the unit under test;
 * PurposeExtras stays REAL (its copy is asserted here).
 */
vi.mock('./PurposeInspector', () => ({
  PurposeInspector: () => <div data-testid="section-purpose" />,
}));
vi.mock('./InstructionsSection', () => ({
  InstructionsSection: () => <div data-testid="section-instructions" />,
}));
vi.mock('./BrainSection', () => ({
  BrainSection: () => <div data-testid="section-brain" />,
}));
vi.mock('./KnowledgeSection', () => ({
  KnowledgeSection: () => <div data-testid="section-knowledge" />,
}));
vi.mock('./ToolsSection', () => ({
  ToolsSection: () => <div data-testid="section-tools" />,
}));
vi.mock('./GuardrailsSection', () => ({
  GuardrailsSection: () => <div data-testid="section-guardrails" />,
}));
vi.mock('./MemorySection', () => ({
  MemorySection: () => <div data-testid="section-memory" />,
}));
vi.mock('./ContextSection', () => ({
  ContextSection: () => <div data-testid="section-context" />,
}));
vi.mock('./ResponseSection', () => ({
  ResponseSection: () => <div data-testid="section-response" />,
}));
vi.mock('./RoleSection', () => ({
  RoleSection: () => <div data-testid="section-role" />,
}));
vi.mock('./BudgetSection', () => ({
  BudgetSection: () => <div data-testid="section-budget" />,
}));
vi.mock('./TrySection', () => ({
  TrySection: () => <div data-testid="section-try" />,
}));
vi.mock('./EvaluationSection', () => ({
  EvaluationSection: () => <div data-testid="section-evaluation" />,
}));
vi.mock('./ShipSection', () => ({
  ShipSection: () => <div data-testid="section-ship" />,
}));
vi.mock('./BrandSection', () => ({
  BrandSection: () => <div data-testid="section-brand" />,
}));
vi.mock('./CredentialsPanel', () => ({
  CredentialsPanel: () => <div data-testid="section-credentials" />,
}));
vi.mock('./SamplesSection', () => ({
  SamplesSection: () => <div data-testid="section-samples" />,
}));

let templateSlug: string | null = null;
vi.mock('@hooks/studio/useAgentAuthoring', () => ({
  usePublishReadiness: () => ({ templateSlug }),
}));

const node = (id: string, status: BuilderNode['data']['status'] = 'untouched'): BuilderNode =>
  ({
    id,
    type: 'slot',
    position: { x: 0, y: 0 },
    data: {
      slotKey: id,
      nodeType: 'spine',
      kind: null,
      title: id,
      subtitle: null,
      hint: null,
      status,
      selected: true,
      lock: false,
      color: '#2F7FE0',
      portColor: null,
      lane: laneOf(id as LaneNodeId),
    },
  }) as BuilderNode;

const buildContext = (overrides: Partial<InspectorContext> = {}): InspectorContext => ({
  mode: 'build',
  agentId: 'agent-1',
  agentName: 'Helper',
  description: null,
  canAuthor: true,
  role: 'owner',
  hasDraft: true,
  definition: null,
  versionId: 'v7',
  versionHash: 'abc',
  isDraft: true,
  versionStatus: 'DRAFT',
  models: undefined,
  modelsLoading: false,
  editPath: null,
  tryState: { hasRunnableVersion: false, lastTryAt: null, lastTryFailed: false },
  onTryEvent: () => undefined,
  onEditJump: () => undefined,
  saveSignal: 0,
  publishSignal: 0,
  ...overrides,
});

async function shell(opts: {
  selected: BuilderNode | null;
  context?: InspectorContext;
  nodes?: PurposeNodeDatum[];
  onSelectNode?: (id: string) => void;
}) {
  const onSelectNode = opts.onSelectNode ?? vi.fn();
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <BuilderInspector
          selected={opts.selected}
          context={opts.context ?? buildContext()}
          nodes={opts.nodes}
          onSelectNode={onSelectNode}
        />
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  let rendered!: ReturnType<typeof render>;
  await act(async () => {
    rendered = render(<RouterProvider router={router} />);
  });
  return { onSelectNode, container: rendered.container, unmount: rendered.unmount };
}

beforeEach(() => {
  templateSlug = null;
});

describe('BuilderInspector node mapping', () => {
  const cases: Array<[string, string]> = [
    ['purpose', 'section-purpose'],
    ['instructions', 'section-instructions'],
    ['brain', 'section-brain'],
    ['knowledge', 'section-knowledge'],
    ['tools', 'section-tools'],
    ['memory', 'section-memory'],
    ['context', 'section-context'],
    ['response', 'section-response'],
    ['role', 'section-role'],
    ['guardrails', 'section-guardrails'],
    ['brand', 'section-brand'],
    ['budget', 'section-budget'],
    ['evaluation', 'section-evaluation'],
    ['ship', 'section-ship'],
    ['credentials', 'section-credentials'],
    ['samples', 'section-samples'],
    ['try', 'section-try'],
  ];

  it.each(cases)('mounts the right section for node %s', async (id, testId) => {
    await shell({ selected: node(id) });
    expect(screen.getByTestId(testId)).toBeTruthy();
  });

  it('renders the header with icon and title only — no meta line, no chip', async () => {
    await shell({ selected: node('brain', 'ready') });
    expect(screen.getByText('brain')).toBeTruthy();
    expect(screen.queryByText(/Node ID · brain ·/)).toBeNull();
    expect(screen.queryByText('READY')).toBeNull();
  });

  it('keeps purpose identity-only: no instructions section under purpose', async () => {
    await shell({ selected: node('purpose') });
    expect(screen.getByTestId('section-purpose')).toBeTruthy();
    expect(screen.queryByTestId('section-instructions')).toBeNull();
  });

  it('shows the locked message in new mode for functional nodes', async () => {
    await shell({ selected: node('brain'), context: buildContext({ mode: 'new', agentId: null }) });
    expect(screen.getByText(/Name the agent first/)).toBeTruthy();
    expect(screen.queryByTestId('section-brain')).toBeNull();
  });

  it('locks context, response, and role in new mode — the guard pattern holds for the new sections', async () => {
    for (const id of ['context', 'response', 'role']) {
      const { unmount } = await shell({
        selected: node(id),
        context: buildContext({ mode: 'new', agentId: null }),
      });
      expect(screen.getByText(/Name the agent first/)).toBeTruthy();
      expect(screen.queryByTestId(`section-${id}`)).toBeNull();
      unmount();
    }
  });

  it('shows an empty-state when nothing is selected', async () => {
    await shell({ selected: null });
    expect(screen.getByText(/Click any node on the circuit/)).toBeTruthy();
  });
});

describe('Purpose extras (blueprint, next steps, CTA)', () => {
  const nodes: PurposeNodeDatum[] = [
    { id: 'purpose', label: 'Purpose', status: 'ready' },
    { id: 'brain', label: 'Brain', status: 'untouched' },
    { id: 'tools', label: 'Tools', status: 'attention' },
    { id: 'memory', label: 'Memory', status: 'error' },
    { id: 'knowledge', label: 'Knowledge', status: 'untouched' },
    { id: 'context', label: 'Context', status: 'untouched' },
    { id: 'response', label: 'Response', status: 'attention' },
  ];

  it('orders next steps attention/error first, then untouched, excluding context/response, max 3', async () => {
    await shell({ selected: node('purpose'), nodes });
    const region = screen.getByLabelText('Next steps');
    const rows = within(region).getAllByRole('button');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Fix Tools'),
      expect.stringContaining('Fix Memory'),
      expect.stringContaining('Set up Brain'),
    ]);
    expect(within(region).queryByText(/Context|Response/)).toBeNull();
  });

  it('chevron rows and the CTA call onSelectNode with the real next step', async () => {
    const { onSelectNode } = await shell({ selected: node('purpose'), nodes });
    const region = screen.getByLabelText('Next steps');
    fireEvent.click(within(region).getAllByRole('button')[0]);
    expect(onSelectNode).toHaveBeenCalledWith('tools');
    fireEvent.click(screen.getByText(/Continue setup — Tools/));
    expect(onSelectNode).toHaveBeenCalledWith('tools');
  });

  it('shows the ship review row when nothing is left to configure', async () => {
    const { onSelectNode } = await shell({
      selected: node('purpose'),
      nodes: [{ id: 'purpose', label: 'Purpose', status: 'ready' }],
    });
    expect(screen.getByText(/Ready to publish — review the Ship node/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Review publish readiness/));
    expect(onSelectNode).toHaveBeenCalledWith('ship');
  });

  it('renders the linked blueprint card only when templateSlug exists', async () => {
    templateSlug = 'support-copilot';
    await shell({ selected: node('purpose'), nodes: [] });
    expect(screen.getByText('support-copilot')).toBeTruthy();
    const link = screen.getByText(/Browse the template gallery/).closest('a');
    expect(link?.getAttribute('href')).toBe('/agent-studio/templates');
  });

  it('omits the blueprint card when there is no templateSlug', async () => {
    await shell({ selected: node('purpose'), nodes: [] });
    expect(screen.queryByText(/Browse the template gallery/)).toBeNull();
  });

  it('hides the extras entirely in new mode', async () => {
    await shell({
      selected: node('purpose'),
      context: buildContext({ mode: 'new', agentId: null }),
      nodes,
    });
    expect(screen.queryByLabelText('Next steps')).toBeNull();
    expect(screen.queryByText(/Browse the template gallery/)).toBeNull();
  });
});
