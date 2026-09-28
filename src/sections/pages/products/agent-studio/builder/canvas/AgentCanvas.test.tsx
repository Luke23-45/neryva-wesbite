// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Position } from '@xyflow/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { AgentCanvas, type AgentCanvasProps } from './AgentCanvas';
import type { BuilderEdge, BuilderNode } from '../lib/projector';

const NODES: BuilderNode[] = [
  {
    id: 'purpose',
    type: 'slot',
    position: { x: 0, y: 0 },
    // Fixed v10 card geometry, declared via the v12 measured/handles props
    // so edges initialize in jsdom (no layout there); the real browser
    // measures the CSS-pinned card and the CanvasSlotNode handle elements.
    measured: { width: 200, height: 100 },
    handles: [
      { id: 'in', type: 'target', position: Position.Left, x: 0, y: 50 },
      { id: 'out', type: 'source', position: Position.Right, x: 200, y: 50 },
    ],
    data: {
      slotKey: 'purpose',
      nodeType: 'spine',
      kind: null,
      title: 'Purpose',
      subtitle: null,
      hint: 'Role, task, rules',
      status: 'ready',
      selected: false,
      lock: true,
      portColor: null,
      color: '#60A5FA',
      lane: 'identity',
    },
  },
  {
    id: 'knowledge',
    type: 'slot',
    position: { x: 340, y: 0 },
    measured: { width: 200, height: 100 },
    handles: [
      { id: 'in', type: 'target', position: Position.Left, x: 0, y: 50 },
      { id: 'out', type: 'source', position: Position.Right, x: 200, y: 50 },
    ],
    data: {
      slotKey: 'knowledge',
      nodeType: 'satellite',
      kind: 'knowledge',
      title: 'Knowledge',
      subtitle: '2 of 2 mapped',
      hint: 'Not configured',
      status: 'info',
      selected: false,
      lock: false,
      portColor: '#0A84FF',
      color: '#0A84FF',
      lane: 'capabilities',
    },
  },
];

const EDGES: BuilderEdge[] = [
  {
    id: 'e-brand',
    source: 'knowledge',
    target: 'purpose',
    type: 'data',
    data: { variant: 'verdict', lit: false, label: 'voice & tone' },
  },
];

function renderCanvas(overrides: Partial<AgentCanvasProps> = {}) {
  const handlers = {
    onSelectNode: vi.fn(),
    onNodePosition: vi.fn(),
    onPositionsCommitted: vi.fn(),
    onPortClick: vi.fn(),
    onTidy: vi.fn(),
    onValidate: vi.fn(),
    onReviewIssues: vi.fn(),
  };
  const props: AgentCanvasProps = {
    nodes: NODES,
    edges: EDGES,
    layoutRev: 0,
    locked: false,
    blockers: 2,
    suggestions: 3,
    ...handlers,
    ...overrides,
  };
  const utils = render(
    <ThemeProvider theme={theme}>
      <AgentCanvas {...props} />
    </ThemeProvider>,
  );
  return { ...utils, handlers };
}

describe('AgentCanvas toolbar', () => {
  it('wires Tidy to onTidy and Fit to the viewport', async () => {
    const { handlers, container } = renderCanvas();
    fireEvent.click(screen.getByRole('button', { name: 'Tidy' }));
    expect(handlers.onTidy).toHaveBeenCalledTimes(1);
    // Fit + zoom controls render with a live zoom readout.
    expect(screen.getByRole('button', { name: 'Fit view' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeTruthy();
    await waitFor(() => expect(container.querySelector('.react-flow')).toBeTruthy());
    expect(screen.getByLabelText(/Zoom \d+ percent/)).toBeTruthy();
  });

  it('toggles the dotted grid background', () => {
    const { container } = renderCanvas();
    const gridButton = screen.getByRole('button', { name: 'Toggle grid' });
    expect(gridButton.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.react-flow__background')).toBeTruthy();
    fireEvent.click(gridButton);
    expect(gridButton.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('.react-flow__background')).toBeNull();
  });

  it('toggles the minimap and its OVERVIEW caption', () => {
    const { container } = renderCanvas();
    const minimapButton = screen.getByRole('button', { name: 'Toggle overview' });
    expect(container.querySelector('.react-flow__minimap')).toBeTruthy();
    expect(screen.getByText('OVERVIEW')).toBeTruthy();
    fireEvent.click(minimapButton);
    expect(minimapButton.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('.react-flow__minimap')).toBeNull();
    expect(screen.queryByText('OVERVIEW')).toBeNull();
  });

  it('wires Validate to onValidate with an amber dot when blockers exist', () => {
    const { handlers, container } = renderCanvas({ blockers: 2 });
    fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
    expect(handlers.onValidate).toHaveBeenCalledTimes(1);
    const dot = container.querySelector('[data-testid="validate-dot"]');
    expect(dot).toBeTruthy();
    expect(getComputedStyle(dot as Element).backgroundColor).toBe('rgb(245, 165, 36)');
  });

  it('shows a green validate dot when nothing blocks', () => {
    const { container } = renderCanvas({ blockers: 0, suggestions: 0 });
    const dot = container.querySelector('[data-testid="validate-dot"]');
    expect(getComputedStyle(dot as Element).backgroundColor).toBe('rgb(61, 214, 140)');
  });
});

describe('AgentCanvas issues pill', () => {
  it('shows counts and routes Review to onReviewIssues', () => {
    const { handlers } = renderCanvas({ blockers: 2, suggestions: 3 });
    expect(screen.getByText('2 blocking issues · 3 suggestions')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(handlers.onReviewIssues).toHaveBeenCalledTimes(1);
  });

  it('hides the pill when there is nothing to report', () => {
    renderCanvas({ blockers: 0, suggestions: 0 });
    expect(screen.queryByRole('button', { name: 'Review' })).toBeNull();
  });
});

describe('AgentCanvas graph', () => {
  it('renders slot nodes and the labeled dashed edge', async () => {
    renderCanvas();
    expect(await screen.findByText('Purpose')).toBeTruthy();
    expect(await screen.findByText('voice & tone')).toBeTruthy();
  });

  it('renders the five v10 lane hulls from lane-model geometry', async () => {
    const { container } = renderCanvas();
    await screen.findByText('Purpose');
    const hulls = container.querySelectorAll('[data-testid^="lane-hull-"]');
    expect(hulls.length).toBe(5);
    for (const lane of ['identity', 'capabilities', 'cognition', 'control', 'delivery']) {
      expect(container.querySelector(`[data-testid="lane-hull-${lane}"]`)).toBeTruthy();
    }
  });
  it('marks the touched port connected from the real edge list', async () => {
    const { container } = renderCanvas();
    await screen.findByText('Knowledge');
    const port = container.querySelector('button[aria-label="Filter rack to Knowledge"]');
    expect(port?.querySelector('[data-testid="port-connected"]')).toBeTruthy();
  });
});
