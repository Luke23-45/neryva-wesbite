// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { ResizeHandle } from './ResizeHandle';

function renderHandle(side: 'left' | 'right') {
  const onDelta = vi.fn();
  const onResizeEnd = vi.fn();
  const onCollapse = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ResizeHandle
        side={side}
        label={`Resize ${side} panel`}
        onDelta={onDelta}
        onResizeEnd={onResizeEnd}
        onCollapse={onCollapse}
      />
    </ThemeProvider>,
  );
  const handle = screen.getByRole('separator', { name: `Resize ${side} panel` });
  return { onDelta, onResizeEnd, onCollapse, handle };
}

describe('ResizeHandle (T15)', () => {
  it('exposes separator semantics and the resize hint', () => {
    const { handle } = renderHandle('left');
    expect(handle).toHaveAttribute('role', 'separator');
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('title', 'Drag to resize · double-click to hide');
    expect(handle).toHaveAttribute('tabindex', '0');
  });

  it('reports pointer drag deltas as raw pointer movement, then ends on pointer-up', () => {
    const { onDelta, onResizeEnd, handle } = renderHandle('left');
    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 130, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 115, pointerId: 1 });
    expect(onDelta).toHaveBeenCalledTimes(2);
    expect(onDelta).toHaveBeenNthCalledWith(1, 30);
    expect(onDelta).toHaveBeenNthCalledWith(2, -15);
    expect(onResizeEnd).not.toHaveBeenCalled();
    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(onResizeEnd).toHaveBeenCalledTimes(1);
  });

  it('ignores pointer moves when no drag is in progress', () => {
    const { onDelta, handle } = renderHandle('right');
    fireEvent.pointerMove(handle, { clientX: 500, pointerId: 1 });
    expect(onDelta).not.toHaveBeenCalled();
  });

  it('ends the drag on pointer cancel', () => {
    const { onResizeEnd, handle } = renderHandle('right');
    fireEvent.pointerDown(handle, { clientX: 200, pointerId: 1 });
    fireEvent.pointerCancel(handle, { pointerId: 1 });
    expect(onResizeEnd).toHaveBeenCalledTimes(1);
  });

  it('double-click collapses the panel', () => {
    const { onCollapse, handle } = renderHandle('left');
    fireEvent.doubleClick(handle);
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  it('ArrowRight widens the left panel by 8px and commits the resize', () => {
    const { onDelta, onResizeEnd, handle } = renderHandle('left');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onDelta).toHaveBeenCalledWith(8);
    expect(onResizeEnd).toHaveBeenCalledTimes(1);
  });

  it('ArrowRight narrows the right panel by 8px (its inner edge is on the left)', () => {
    const { onDelta, handle } = renderHandle('right');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onDelta).toHaveBeenCalledWith(-8);
  });

  it('ArrowLeft narrows the left panel and widens the right panel', () => {
    const left = renderHandle('left');
    fireEvent.keyDown(left.handle, { key: 'ArrowLeft' });
    expect(left.onDelta).toHaveBeenCalledWith(-8);

    const right = renderHandle('right');
    fireEvent.keyDown(right.handle, { key: 'ArrowLeft' });
    expect(right.onDelta).toHaveBeenCalledWith(8);
  });

  it('Shift+Arrow moves in 32px steps', () => {
    const { onDelta, handle } = renderHandle('left');
    fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true });
    expect(onDelta).toHaveBeenCalledWith(-32);
  });

  it('ignores non-arrow keys', () => {
    const { onDelta, onResizeEnd, handle } = renderHandle('left');
    fireEvent.keyDown(handle, { key: 'Enter' });
    expect(onDelta).not.toHaveBeenCalled();
    expect(onResizeEnd).not.toHaveBeenCalled();
  });
});
