// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import type { AgentVersion, PublishReadiness } from '@hooks/studio/useAgentAuthoring';
import type { PublishReadinessRow } from '@hooks/studio/useAgentAuthoring';
import { OverviewScreen } from './OverviewScreen';
import type { SectionEntry } from '../nav/section-groups';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children?: ReactNode; to?: string }) => <a href={to ?? '#'}>{children}</a>,
}));

function renderOverview(ui: ReactNode) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const ENTRIES: SectionEntry[] = [
  { id: 'purpose', label: 'Purpose', status: 'ready', statusText: '' },
  { id: 'instructions', label: 'Instructions', status: 'ready', statusText: '' },
  { id: 'role', label: 'Role', status: 'untouched', statusText: '' },
  { id: 'brand', label: 'Brand', status: 'untouched', statusText: '' },
  { id: 'model', label: 'Model', status: 'attention', statusText: 'Pick a model' },
  { id: 'brain', label: 'Brain', status: 'untouched', statusText: '' },
  { id: 'knowledge', label: 'Knowledge', status: 'ready', statusText: '' },
  { id: 'context', label: 'Context', status: 'ready', statusText: '' },
  { id: 'memory', label: 'Memory', status: 'ready', statusText: '' },
  { id: 'tools', label: 'Tools', status: 'ready', statusText: '' },
  { id: 'credentials', label: 'Credentials', status: 'skipped', statusText: '' },
  { id: 'guardrails', label: 'Guardrails', status: 'ready', statusText: '' },
  { id: 'response', label: 'Response', status: 'ready', statusText: '' },
  { id: 'budget', label: 'Budget', status: 'ready', statusText: '' },
  { id: 'samples', label: 'Samples', status: 'untouched', statusText: '' },
  { id: 'try', label: 'Try', status: 'untouched', statusText: '' },
  { id: 'evaluation', label: 'Evaluation', status: 'untouched', statusText: '' },
  { id: 'ship', label: 'Ship', status: 'attention', statusText: '' },
];

function row(over: Partial<PublishReadinessRow>): PublishReadinessRow {
  return {
    id: 'models',
    title: 'Model selected',
    detail: 'Pick at least one model.',
    extra: null,
    ok: false,
    ackable: false,
    fix: { title: '', fixLabel: 'Choose a model', fixRoute: null, editTarget: 'model' },
    ...over,
  } as PublishReadinessRow;
}

function readiness(over: Partial<PublishReadiness> = {}): PublishReadiness {
  return {
    version: null,
    activeVersion: null,
    templateSlug: null,
    templateVersion: null,
    rows: [],
    verdict: 'unknown',
    publishable: false,
    blockers: 0,
    needsAcknowledge: false,
    unresolvedSlugs: [],
    unreadySlugs: [],
    noChangeHint: false,
    requiredChecks: [],
    decision: null,
    decisionFinishedAt: null,
    evalRunning: false,
    isPending: false,
    isError: false,
    retry: vi.fn(),
    ...over,
  };
}

const LIVE_DEF = defaultConsumer();
const DRAFT_DEF = { ...defaultConsumer(), instructions: 'changed' };

function version(over: Partial<AgentVersion>): AgentVersion {
  return {
    id: 'v-id',
    version: 0,
    status: 'DRAFT',
    hash: null,
    createdAt: null,
    publishedAt: null,
    publishedBy: null,
    rollbackOf: null,
    definition: LIVE_DEF,
    updatedAt: null,
    parentVersionId: null,
    ...over,
  };
}

const BASE = {
  entries: ENTRIES,
  versions: [version({ id: 'live', version: 6, status: 'PUBLISHED' }), version({ id: 'draft', version: 0, status: 'DRAFT' })],
  workingVersion: { versionId: 'draft', status: 'DRAFT', isDraft: true },
  activeVersionId: 'live',
  draftDefinition: DRAFT_DEF,
  buildHref: '/agent-studio/agents/a/build',
  onSelectSection: vi.fn(),
};

describe('OverviewScreen', () => {
  it('renders blockers with their fix jumps and deep-links to the section', () => {
    const onSelectSection = vi.fn();
    renderOverview(
      <OverviewScreen
        {...BASE}
        onSelectSection={onSelectSection}
        readiness={readiness({ rows: [row({}), row({ id: 'shape', title: 'Shape', detail: 'ok', ok: true, fix: { title: '', fixLabel: '', fixRoute: null, editTarget: null } })] })}
      />,
    );
    expect(screen.getByText('1 blocking issue')).toBeInTheDocument();
    expect(screen.getByText('Model selected')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Choose a model →'));
    expect(onSelectSection).toHaveBeenCalledWith('model');
  });

  it('shows the ready state when every check passes', () => {
    renderOverview(
      <OverviewScreen {...BASE} readiness={readiness({ rows: [row({ ok: true, detail: 'ok' })] })} />,
    );
    expect(screen.getByText('Ready to publish — all checks pass.')).toBeInTheDocument();
  });

  it('shows a checking state while rows are pending and an error state with retry', () => {
    const retry = vi.fn();
    const { rerender } = renderOverview(
      <OverviewScreen {...BASE} readiness={readiness({ isPending: true, rows: [row({ ok: null })] })} />,
    );
    expect(screen.getByText('Checking publish readiness…')).toBeInTheDocument();
    rerender(
      <ThemeProvider theme={theme}>
        <OverviewScreen {...BASE} readiness={readiness({ isError: true, retry })} />
      </ThemeProvider>,
    );
    expect(screen.getByText("Couldn't check readiness.")).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(retry).toHaveBeenCalled();
  });

  it('renders per-group configured counts and jumps to the neediest section', () => {
    const onSelectSection = vi.fn();
    renderOverview(<OverviewScreen {...BASE} onSelectSection={onSelectSection} readiness={readiness()} />);
    // Agent group: purpose + instructions ready, role + brand untouched → 2 of 4.
    expect(screen.getByLabelText('Agent: 2 of 4 configured')).toBeInTheDocument();
    // Intelligence group: model is attention → the chevron jumps to model.
    // (1 section since the 2026-09-30 brain soft-delete.)
    fireEvent.click(screen.getByLabelText('Intelligence: 0 of 1 configured'));
    expect(onSelectSection).toHaveBeenCalledWith('model');
  });

  it('renders the version card: draft pill, live version, next number, honest changed count', () => {
    renderOverview(<OverviewScreen {...BASE} readiness={readiness()} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('v6')).toBeInTheDocument();
    expect(screen.getByText(/Expected v7 · assigned at publish/)).toBeInTheDocument();
    expect(screen.getByText(/1 section changed since v6/)).toBeInTheDocument();
    expect(screen.getByText(/Instructions/)).toBeInTheDocument();
  });

  it('hides the changed line when never published and says so honestly', () => {
    renderOverview(
      <OverviewScreen
        {...BASE}
        versions={[version({ id: 'draft', version: 0, status: 'DRAFT' })]}
        activeVersionId={null}
        readiness={readiness()}
      />,
    );
    expect(screen.getByText('Not published yet')).toBeInTheDocument();
    expect(screen.getByText(/Expected v1 · assigned at publish/)).toBeInTheDocument();
    expect(screen.queryByText(/changed since/)).not.toBeInTheDocument();
  });

  it('shows a neutral "No version yet" status instead of lying "Published" when no version exists', () => {
    renderOverview(
      <OverviewScreen
        {...BASE}
        versions={[]}
        workingVersion={{ versionId: null, status: null, isDraft: false }}
        activeVersionId={null}
        draftDefinition={null}
        readiness={readiness()}
      />,
    );
    expect(screen.getByText('No version yet')).toBeInTheDocument();
    expect(screen.queryByText('Published')).not.toBeInTheDocument();
    expect(screen.getByText('Not published yet')).toBeInTheDocument();
  });
});
