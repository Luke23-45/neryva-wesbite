// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import type { NodeProps } from '@xyflow/react';
import { SlotNode, type RuntimeSlotNodeData } from './SlotNode';
import type { SlotStatus } from '../../lib/slot-model';

function props(data: Partial<RuntimeSlotNodeData>): NodeProps {
  return {
    id: 'sat:knowledge',
    data: {
      slotKey: 'sat:knowledge',
      nodeType: 'satellite',
      kind: 'knowledge',
      title: 'Knowledge',
      subtitle: null,
      hint: 'Not configured',
      status: 'untouched',
      selected: false,
      lock: false,
      portColor: '#0A84FF',
      ...data,
    },
  } as unknown as NodeProps;
}

function renderNode(data: Partial<RuntimeSlotNodeData> = {}) {
  // SlotNode is provider-free (edge anchors live in CanvasSlotNode), so it
  // unit-renders standalone.
  return render(
    <ThemeProvider theme={theme}>
      <SlotNode {...props(data)} />
    </ThemeProvider>,
  );
}

/** The v10 card element (role=button) for computed-style assertions. */
function cardOf(container: HTMLElement): HTMLElement {
  const card = container.querySelector('[role="button"]');
  if (!card) throw new Error('node card not found');
  return card as HTMLElement;
}

describe('SlotNode', () => {
  it('renders title with subtitle when configured, without hooks or queries', () => {
    const onSelectNode = vi.fn();
    const { container } = renderNode({ subtitle: '2 of 2 mapped', status: 'info' });
    expect(screen.getByText('Knowledge')).toBeTruthy();
    expect(screen.getByText('2 of 2 mapped')).toBeTruthy();
    expect(container.querySelector('[aria-label="Knowledge — 2 of 2 mapped"]')).toBeTruthy();
    expect(onSelectNode).not.toHaveBeenCalled();
  });

  it('renders ghost hints dashed-never-red and routes the dock port without selecting', () => {
    const onPortClick = vi.fn();
    const { container } = renderNode({ status: 'untouched', onPortClick });
    expect(screen.getByText('Not configured')).toBeTruthy();
    const port = container.querySelector('button[aria-label="Filter rack to Knowledge"]');
    expect(port).toBeTruthy();
    fireEvent.click(port as Element);
    expect(onPortClick).toHaveBeenCalledWith('knowledge');
  });

  it('marks immutable identity with a lock and an honest tooltip', () => {
    renderNode({ slotKey: 'purpose', nodeType: 'spine', kind: null, title: 'Purpose', lock: true, status: 'ready' });
    expect(screen.getByLabelText('Locked: identity cannot be renamed')).toBeTruthy();
  });

  it('renders empty typed cards as the picker entry', () => {
    renderNode({
      slotKey: 'sat:custom:1',
      nodeType: 'empty',
      kind: null,
      title: 'New component',
      hint: 'Choose a type — K · T · G · E · ⇧M',
      portColor: null,
    });
    expect(screen.getByText('New component')).toBeTruthy();
    expect(screen.getByText(/Choose a type/)).toBeTruthy();
  });

  it.each([
    ['ready', 'READY'],
    ['attention', 'REVIEW'],
    ['error', 'REVIEW'],
    ['untouched', 'EMPTY'],
    ['locked', 'EMPTY'],
    ['skipped', 'SKIPPED'],
    ['info', 'SYNC'],
  ] as Array<[SlotStatus, string]>)('renders the %s status as the %s chip', (status, chip) => {
    renderNode({ status });
    expect(screen.getByText(chip)).toBeTruthy();
  });

  it('keeps a uniform 1px border for every status (A3 — no status-tinted variants)', () => {
    const colors = new Set<string>();
    (['ready', 'attention', 'error', 'untouched', 'locked', 'skipped', 'info'] as SlotStatus[]).forEach((status) => {
      const { container, unmount } = renderNode({ status });
      const borderColor = getComputedStyle(cardOf(container)).borderTopColor;
      colors.add(borderColor);
      expect(borderColor).toBe('rgb(38, 47, 63)'); // #262F3F
      unmount();
    });
    expect(colors.size).toBe(1);
  });

  it('renders ghosts dashed and never red', () => {
    const { container, unmount } = renderNode({ status: 'untouched' });
    const ghostStyle = getComputedStyle(cardOf(container));
    expect(ghostStyle.borderTopStyle).toBe('dashed');
    expect(ghostStyle.borderTopColor).toBe('rgb(38, 47, 63)');
    unmount();

    const solid = renderNode({ status: 'ready' });
    expect(getComputedStyle(cardOf(solid.container)).borderTopStyle).toBe('solid');
    solid.unmount();
  });

  it('marks selection with a lightened 1px border and lift shadow — no overlay, no chrome', () => {
    const { container } = renderNode({ selected: true, status: 'ready' });
    const style = getComputedStyle(cardOf(container));
    expect(style.borderTopColor).toBe('rgb(215, 222, 232)');
    expect(style.borderTopWidth).toBe('1px');
    expect(style.boxShadow).not.toBe('none');
    expect(container.querySelector('[data-testid="node-halo"]')).toBeNull();
    expect(container.querySelectorAll('[data-testid="node-corner"]').length).toBe(0);
  });

  it('keeps the default border and no shadow when unselected', () => {
    const { container } = renderNode({ selected: false, status: 'ready' });
    const style = getComputedStyle(cardOf(container));
    expect(style.borderTopColor).toBe('rgb(38, 47, 63)');
    expect(style.boxShadow === 'none' || style.boxShadow === '').toBe(true);
  });

  it('opens the inspector via selection when the gear is clicked', () => {
    const onSelectNode = vi.fn();
    renderNode({ onSelectNode });
    fireEvent.click(screen.getByRole('button', { name: 'Open Knowledge in the inspector' }));
    expect(onSelectNode).toHaveBeenCalledWith('sat:knowledge');
  });

  it('marks the port dot connected only when the canvas says an edge touches it', () => {
    const { container, unmount } = renderNode({ connected: true });
    const port = container.querySelector('button[aria-label="Filter rack to Knowledge"]');
    expect(port?.querySelector('[data-testid="port-connected"]')).toBeTruthy();
    unmount();

    const idle = renderNode({ connected: false });
    const idlePort = idle.container.querySelector('button[aria-label="Filter rack to Knowledge"]');
    expect(idlePort?.querySelector('[data-testid="port-connected"]')).toBeNull();
    idle.unmount();
  });

  it('renders no port where the projector supplies none', () => {
    const { container } = renderNode({ portColor: null });
    expect(container.querySelector('button[aria-label="Filter rack to Knowledge"]')).toBeNull();
  });
});
