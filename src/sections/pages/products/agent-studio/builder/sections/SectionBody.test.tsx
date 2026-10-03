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
import { SectionBody, type InspectorContext } from './SectionBody';
import type { PurposeNodeDatum } from '../inspector/PurposeExtras';
import type { PurposeHandle } from '../inspector/PurposeInspector';
import type { RefObject } from 'react';

/**
 * Mapping tests: the 18 section ids each mount their section in the main
 * pane. Sections are stubbed — the mapping is the unit under test;
 * PurposeExtras stays REAL (its copy is asserted here).
 */
vi.mock('../inspector/PurposeInspector', () => ({
  PurposeInspector: () => <div data-testid="section-purpose" />,
}));
vi.mock('../inspector/InstructionsSection', () => ({
  InstructionsSection: () => <div data-testid="section-instructions" />,
}));
vi.mock('../inspector/BrainSection', () => ({
  BrainSection: () => <div data-testid="section-brain" />,
}));
vi.mock('../inspector/ModelSection', () => ({
  ModelSection: () => <div data-testid="section-model" />,
}));
vi.mock('../inspector/KnowledgeSection', () => ({
  KnowledgeSection: () => <div data-testid="section-knowledge" />,
}));
vi.mock('../inspector/ToolsSection', () => ({
  ToolsSection: () => <div data-testid="section-tools" />,
}));
vi.mock('../inspector/GuardrailsSection', () => ({
  GuardrailsSection: () => <div data-testid="section-guardrails" />,
}));
vi.mock('../inspector/MemorySection', () => ({
  MemorySection: () => <div data-testid="section-memory" />,
}));
vi.mock('../inspector/ContextSection', () => ({
  ContextSection: () => <div data-testid="section-context" />,
}));
vi.mock('../inspector/ResponseSection', () => ({
  ResponseSection: () => <div data-testid="section-response" />,
}));
vi.mock('../inspector/RoleSection', () => ({
  RoleSection: () => <div data-testid="section-role" />,
}));
vi.mock('../inspector/BudgetSection', () => ({
  BudgetSection: () => <div data-testid="section-budget" />,
}));
vi.mock('../inspector/TrySection', () => ({
  TrySection: () => <div data-testid="section-try" />,
}));
vi.mock('../inspector/EvaluationSection', () => ({
  EvaluationSection: () => <div data-testid="section-evaluation" />,
}));
vi.mock('../inspector/ShipSection', () => ({
  ShipSection: () => <div data-testid="section-ship" />,
}));
vi.mock('../inspector/BrandSection', () => ({
  BrandSection: () => <div data-testid="section-brand" />,
}));
vi.mock('../inspector/CredentialsPanel', () => ({
  CredentialsPanel: () => <div data-testid="section-credentials" />,
}));
vi.mock('./CredentialsRail', () => ({
  CredentialsRail: () => <div data-testid="credentials-rail" />,
}));
vi.mock('../inspector/SamplesSection', () => ({
  SamplesSection: () => <div data-testid="section-samples" />,
}));

let templateSlug: string | null = null;
vi.mock('@hooks/studio/useAgentAuthoring', () => ({
  usePublishReadiness: () => ({ templateSlug }),
}));

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
  degradedAck: false,
  onDegradedAck: () => undefined,
  requestSave: () => undefined,
  ...overrides,
});

async function shell(opts: {
  sectionId: string;
  context?: InspectorContext;
  purposeNodes?: PurposeNodeDatum[];
  onPurposeSelect?: (id: string) => void;
  purposeRef?: RefObject<PurposeHandle | null>;
}) {
  const onPurposeSelect = opts.onPurposeSelect ?? vi.fn();
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <SectionBody
          sectionId={opts.sectionId}
          context={opts.context ?? buildContext()}
          purposeNodes={opts.purposeNodes}
          onPurposeSelect={onPurposeSelect}
          purposeRef={opts.purposeRef}
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
  return { onPurposeSelect, container: rendered.container, unmount: rendered.unmount };
}

beforeEach(() => {
  templateSlug = null;
});

describe('SectionBody section mapping', () => {
  const cases: Array<[string, string]> = [
    ['purpose', 'section-purpose'],
    ['instructions', 'section-instructions'],
    ['brain', 'section-brain'],
    ['model', 'section-model'],
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

  it.each(cases)('mounts the right section for id %s', async (id, testId) => {
    await shell({ sectionId: id });
    expect(screen.getByTestId(testId)).toBeTruthy();
  });

  it('renders the section title in the pane header — no canvas chrome', async () => {
    // The pane header is gone (the sidebar already says where the user is);
    // the title now surfaces on the section wrap's accessible label.
    await shell({ sectionId: 'brain' });
    expect(screen.getByLabelText('brain section')).toBeTruthy();
    expect(screen.queryByText(/Node ID · brain ·/)).toBeNull();
    expect(screen.queryByText('READY')).toBeNull();
  });

  it('reads purpose as Identity in the header', async () => {
    await shell({ sectionId: 'purpose' });
    expect(screen.getByLabelText('Identity section')).toBeTruthy();
  });

  it('keeps purpose identity-only: no instructions section under purpose', async () => {
    await shell({ sectionId: 'purpose' });
    expect(screen.getByTestId('section-purpose')).toBeTruthy();
    expect(screen.queryByTestId('section-instructions')).toBeNull();
  });

  it('shows the locked message in new mode for functional sections', async () => {
    await shell({ sectionId: 'brain', context: buildContext({ mode: 'new', agentId: null }) });
    expect(screen.getByText(/Name the agent first/)).toBeTruthy();
    expect(screen.queryByTestId('section-brain')).toBeNull();
  });

  it('locks context, response, and role in new mode', async () => {
    for (const id of ['context', 'response', 'role']) {
      const { unmount } = await shell({
        sectionId: id,
        context: buildContext({ mode: 'new', agentId: null }),
      });
      expect(screen.getByText(/Name the agent first/)).toBeTruthy();
      expect(screen.queryByTestId(`section-${id}`)).toBeNull();
      unmount();
    }
  });

  it('shows an honest message for an unknown section id', async () => {
    await shell({ sectionId: 'nope' });
    expect(screen.getByText(/Unknown section/)).toBeTruthy();
  });
});

describe('Purpose extras (blueprint, next steps, CTA)', () => {
  const nodes: PurposeNodeDatum[] = [
    { id: 'purpose', label: 'Purpose', status: 'ready' },
    { id: 'model', label: 'Model', status: 'untouched' },
    { id: 'tools', label: 'Tools', status: 'attention' },
    { id: 'memory', label: 'Memory', status: 'error' },
    { id: 'knowledge', label: 'Knowledge', status: 'untouched' },
    { id: 'context', label: 'Context', status: 'untouched' },
    { id: 'response', label: 'Response', status: 'attention' },
  ];

  it('orders next steps attention/error first, then untouched, excluding context/response/brain, max 3', async () => {
    await shell({ sectionId: 'purpose', purposeNodes: nodes });
    const region = screen.getByLabelText('Next steps');
    const rows = within(region).getAllByRole('button');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Fix Tools'),
      expect.stringContaining('Fix Memory'),
      expect.stringContaining('Set up Model'),
    ]);
    expect(within(region).queryByText(/Context|Response/)).toBeNull();
  });

  it('chevron rows and the CTA call onPurposeSelect with the real next step', async () => {
    const { onPurposeSelect } = await shell({ sectionId: 'purpose', purposeNodes: nodes });
    const region = screen.getByLabelText('Next steps');
    fireEvent.click(within(region).getAllByRole('button')[0]);
    expect(onPurposeSelect).toHaveBeenCalledWith('tools');
    fireEvent.click(screen.getByText(/Continue setup — Tools/));
    expect(onPurposeSelect).toHaveBeenCalledWith('tools');
  });

  it('shows the ship review row when nothing is left to configure', async () => {
    const { onPurposeSelect } = await shell({
      sectionId: 'purpose',
      purposeNodes: [{ id: 'purpose', label: 'Purpose', status: 'ready' }],
    });
    expect(screen.getByText(/Ready to publish — review the Ship node/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Review publish readiness/));
    expect(onPurposeSelect).toHaveBeenCalledWith('ship');
  });

  it('renders the linked blueprint card only when templateSlug exists', async () => {
    templateSlug = 'support-copilot';
    await shell({ sectionId: 'purpose', purposeNodes: [] });
    expect(screen.getByText('support-copilot')).toBeTruthy();
    const link = screen.getByText(/Browse the template gallery/).closest('a');
    expect(link?.getAttribute('href')).toBe('/agent-studio/templates');
  });

  it('omits the blueprint card when there is no templateSlug', async () => {
    await shell({ sectionId: 'purpose', purposeNodes: [] });
    expect(screen.queryByText(/Browse the template gallery/)).toBeNull();
  });

  it('hides the extras entirely in new mode', async () => {
    await shell({
      sectionId: 'purpose',
      context: buildContext({ mode: 'new', agentId: null }),
      purposeNodes: nodes,
    });
    expect(screen.queryByLabelText('Next steps')).toBeNull();
    expect(screen.queryByText(/Browse the template gallery/)).toBeNull();
  });
});

describe('SectionBody per-section Save', () => {
  const SAVE_CASES: Array<[string, string]> = [
    ['purpose', 'Save Identity'],
    ['instructions', 'Save instructions'],
    ['role', 'Save role'],
    ['brand', 'Save brand'],
    ['model', 'Save model'],
    ['brain', 'Save brain'],
    ['knowledge', 'Save knowledge'],
    ['context', 'Save context'],
    ['tools', 'Save tools'],
    ['guardrails', 'Save guardrails'],
    ['response', 'Save response'],
    ['budget', 'Save budget'],
  ];

  it.each(SAVE_CASES)('shows "%s" in build mode for authors', async (id, label) => {
    await shell({ sectionId: id });
    expect(screen.getByRole('button', { name: label })).toBeTruthy();
  });

  it.each(['credentials', 'samples', 'try', 'evaluation', 'ship'])(
    'shows no Save button on the %s action surface — its own verbs stay',
    async (id) => {
      await shell({ sectionId: id });
      expect(screen.queryByRole('button', { name: /^Save / })).toBeNull();
    },
  );

  it('shows no Save button on memory — read-only since D-N1, nothing to persist', async () => {
    await shell({ sectionId: 'memory' });
    expect(screen.queryByRole('button', { name: /^Save / })).toBeNull();
  });

  it('hides the Save button from viewers', async () => {
    await shell({ sectionId: 'instructions', context: buildContext({ canAuthor: false }) });
    expect(screen.queryByRole('button', { name: /^Save / })).toBeNull();
  });

  it('hides the Save button in new mode', async () => {
    await shell({ sectionId: 'purpose', context: buildContext({ mode: 'new', agentId: null }) });
    expect(screen.queryByRole('button', { name: /^Save / })).toBeNull();
  });

  it('fires the manual save signal for draft sections on click', async () => {
    const requestSave = vi.fn();
    await shell({ sectionId: 'instructions', context: buildContext({ requestSave }) });
    fireEvent.click(screen.getByRole('button', { name: 'Save instructions' }));
    expect(requestSave).toHaveBeenCalledTimes(1);
  });

  it('routes Save Identity through the PurposeInspector save handle', async () => {
    const save = vi.fn();
    const purposeRef = { current: { submit: () => undefined, save } } as RefObject<PurposeHandle | null>;
    const requestSave = vi.fn();
    await shell({ sectionId: 'purpose', context: buildContext({ requestSave }), purposeRef });
    fireEvent.click(screen.getByRole('button', { name: 'Save Identity' }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(requestSave).not.toHaveBeenCalled();
  });
});
