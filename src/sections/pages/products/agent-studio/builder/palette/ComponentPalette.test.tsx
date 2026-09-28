// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ComponentPalette, type PaletteHealth, type PaletteNodeEntry } from './ComponentPalette';
import type { LaneId } from '../lib/lane-model';
import type { SlotStatus } from '../lib/slot-model';

function node(
  id: string,
  label: string,
  lane: LaneId,
  status: SlotStatus = 'untouched',
  statusText = '',
): PaletteNodeEntry {
  return { id, label, color: '#58A6FF', statusText, status, lane };
}

/** 17 nodes in v10 lane order. */
const NODES: PaletteNodeEntry[] = [
  node('purpose', 'Purpose', 'identity', 'ready', 'Agent named'),
  node('instructions', 'Instructions', 'identity', 'attention', 'Add rules'),
  node('role', 'Role', 'identity', 'untouched'),
  node('knowledge', 'Knowledge', 'capabilities', 'ready', '3 sources'),
  node('tools', 'Tools', 'capabilities', 'untouched'),
  node('memory', 'Memory', 'capabilities', 'untouched'),
  node('credentials', 'Credentials', 'capabilities', 'untouched'),
  node('brain', 'Brain', 'cognition', 'ready', 'gpt-5'),
  node('context', 'Context', 'cognition', 'info', 'Not yet available'),
  node('samples', 'Samples', 'cognition', 'untouched'),
  node('guardrails', 'Guardrails', 'control', 'ready', 'Platform defaults'),
  node('brand', 'Brand', 'control', 'untouched'),
  node('budget', 'Budget', 'control', 'untouched'),
  node('response', 'Response', 'delivery', 'info', 'Not yet available'),
  node('evaluation', 'Evaluation', 'delivery', 'untouched'),
  node('ship', 'Ship', 'delivery', 'attention', '2 blockers'),
  node('try', 'Try', 'delivery', 'untouched'),
];

const HEALTH: PaletteHealth = {
  configured: 5,
  total: 12,
  blockers: 0,
  suggestions: 0,
  nextStep: { label: 'Instructions', nodeId: 'instructions' },
};

function renderPalette(overrides: Partial<Parameters<typeof ComponentPalette>[0]> = {}) {
  const props = {
    nodes: NODES,
    selectedId: null as string | null,
    filter: null as string | null,
    onFilterChange: vi.fn(),
    onSelectNode: vi.fn(),
    locked: false,
    canAuthor: true,
    health: HEALTH,
    onHealthReview: vi.fn(),
    onHealthNext: vi.fn(),
    ...overrides,
  };
  const utils = render(<ComponentPalette {...props} />);
  return { ...utils, props };
}

describe('ComponentPalette (v10)', () => {
  it('count chip is computed from nodes.length, never hardcoded', () => {
    renderPalette({ nodes: NODES.slice(0, 3) });
    expect(screen.getByLabelText('3 components')).toHaveTextContent('3');
  });

  it('renders lane groups in v10 order with no roadmap group', () => {
    renderPalette();
    const labels = screen.getAllByText(/^(IDENTITY|CAPABILITIES|COGNITION|CONTROL & STYLE|OUTPUT & DELIVERY)$/);
    expect(labels.map((el) => el.textContent)).toEqual([
      'IDENTITY',
      'CAPABILITIES',
      'COGNITION',
      'CONTROL & STYLE',
      'OUTPUT & DELIVERY',
    ]);
    expect(screen.queryByText('ROADMAP')).not.toBeInTheDocument();
    // Role is a real row in the IDENTITY group now.
    const role = screen.getByRole('button', { name: /Role/ });
    const group = role.closest('div');
    expect(group?.textContent).toContain('IDENTITY');
  });

  it('search filters rows by label; placeholder carries no ⌘K hint (A4)', () => {
    renderPalette();
    const input = screen.getByPlaceholderText('Search components…');
    expect(input).toHaveAttribute('placeholder', 'Search components…');
    fireEvent.change(input, { target: { value: 'know' } });
    expect(screen.getByText('Knowledge')).toBeInTheDocument();
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
  });

  it('clicking a row fires onSelectNode with the id (no add/drag path)', () => {
    const { props } = renderPalette();
    const row = screen.getByRole('button', { name: /Knowledge/ });
    expect(row).not.toHaveAttribute('draggable');
    fireEvent.click(row);
    expect(props.onSelectNode).toHaveBeenCalledTimes(1);
    expect(props.onSelectNode).toHaveBeenCalledWith('knowledge');
  });

  it('port filter shows only the filtered row and clears via the Clear button', () => {
    const { props } = renderPalette({ filter: 'knowledge' });
    expect(screen.getByText(/Showing/)).toHaveTextContent('Knowledge');
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(props.onFilterChange).toHaveBeenCalledWith(null);
  });

  it('role is a normal selectable row (no locked roadmap rows remain)', () => {
    const { props } = renderPalette();
    const role = screen.getByRole('button', { name: /Role/ });
    expect(role).not.toBeDisabled();
    expect(role).toHaveAttribute('title', 'Select Role');
    fireEvent.click(role);
    expect(props.onSelectNode).toHaveBeenCalledWith('role');
  });

  it('health ring shows configured/total as a percent (5/12 → 42%)', () => {
    const { container } = renderPalette({ health: { ...HEALTH, configured: 5, total: 12 } });
    expect(screen.getByLabelText('42 percent configured')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('5 of 12 configured')).toBeInTheDocument();
    const ring = container.querySelector('svg[aria-label="42 percent configured"]');
    expect(ring).not.toBeNull();
    const circles = ring!.querySelectorAll('circle');
    const circumference = 2 * Math.PI * 15.5;
    expect(circles[1].getAttribute('stroke-dashoffset')).toBe(
      (circumference * (1 - 5 / 12)).toString(),
    );
  });

  it('next-step hint is data-driven and fires onHealthNext with the node id', () => {
    const { props } = renderPalette({
      health: { ...HEALTH, nextStep: { label: 'Knowledge', nodeId: 'knowledge' } },
    });
    const next = screen.getByRole('button', { name: /Next: Knowledge/ });
    fireEvent.click(next);
    expect(props.onHealthNext).toHaveBeenCalledWith('knowledge');
    // No static mockup copy.
    expect(screen.queryByText(/Identity first — wiring after/)).not.toBeInTheDocument();
  });

  it('null nextStep shows the ship-review hint, wired to onHealthReview', () => {
    const { props } = renderPalette({ health: { ...HEALTH, nextStep: null } });
    const review = screen.getByRole('button', { name: /Ready to publish — review the Ship node/ });
    fireEvent.click(review);
    expect(props.onHealthReview).toHaveBeenCalledTimes(1);
  });

  it('blocking row appears only when blockers > 0; review fires onHealthReview', () => {
    const withBlockers = renderPalette({ health: { ...HEALTH, blockers: 2 } });
    expect(screen.getByText('2 blocking issues')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'review' }));
    expect(withBlockers.props.onHealthReview).toHaveBeenCalledTimes(1);
    withBlockers.unmount();

    renderPalette({ health: { ...HEALTH, blockers: 0 } });
    expect(screen.queryByText(/blocking issue/)).not.toBeInTheDocument();
  });

  it('suggestions row is omitted when suggestions is 0', () => {
    renderPalette({ health: { ...HEALTH, suggestions: 0 } });
    expect(screen.queryByText(/suggestion/)).not.toBeInTheDocument();
    const { unmount } = renderPalette({ health: { ...HEALTH, suggestions: 3 } });
    expect(screen.getByText('3 suggestions')).toBeInTheDocument();
    unmount();
  });

  it('locked mode disables rows and health actions with honest reasons', () => {
    renderPalette({ locked: true });
    const row = screen.getByRole('button', { name: /Knowledge/ });
    expect(row).toBeDisabled();
    expect(row).toHaveAttribute('title', 'Name the agent first — the palette unlocks on create.');
    const next = screen.getByRole('button', { name: /Next:/ });
    expect(next).toBeDisabled();
    expect(screen.getByText(/The palette wakes up the moment the agent exists/)).toBeInTheDocument();
  });

  it('viewer mode disables rows with an honest reason', () => {
    renderPalette({ canAuthor: false });
    const row = screen.getByRole('button', { name: /Knowledge/ });
    expect(row).toBeDisabled();
    expect(row).toHaveAttribute('title', 'Viewing only — an owner, admin, or developer edits this agent.');
  });
});
