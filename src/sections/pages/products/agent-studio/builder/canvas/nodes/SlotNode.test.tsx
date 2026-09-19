// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import type { NodeProps } from '@xyflow/react';
import { SlotNode, type RuntimeSlotNodeData } from './SlotNode';

function props(data: Partial<RuntimeSlotNodeData>): NodeProps {
  return {
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
  return render(
    <ThemeProvider theme={theme}>
      <SlotNode {...props(data)} />
    </ThemeProvider>,
  );
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
});
