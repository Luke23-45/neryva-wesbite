import { useRef, useState } from 'react';
import { Handle } from './ResizeHandle.styles';

export interface ResizeHandleProps {
  /** Which panel this handle resizes — sets the hit-area side and the
   * keyboard arrow direction (left panel: ArrowRight widens; right panel:
   * ArrowRight narrows). */
  side: 'left' | 'right';
  /** Live pixel delta while dragging (positive = pointer moved right). */
  onDelta: (dx: number) => void;
  /** Pointer released — the parent commits/persists the live width. */
  onResizeEnd: () => void;
  /** Double-click — collapse the panel (widths are preserved). */
  onCollapse: () => void;
  label: string;
}

const KEY_STEP = 8;
const KEY_STEP_SHIFT = 32;

/**
 * Drag handle between the builder canvas and a sidebar (ledger T15).
 * Pointer drag mutates the aside width directly in the parent (no React
 * state churn mid-drag); keyboard arrows give the same control without a
 * pointer. `setPointerCapture` is guarded — jsdom doesn't implement it.
 */
export function ResizeHandle({ side, onDelta, onResizeEnd, onCollapse, label }: ResizeHandleProps) {
  const dragging = useRef(false);
  const lastX = useRef(0);
  const [active, setActive] = useState(false);

  const stop = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setActive(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    onResizeEnd();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.shiftKey ? KEY_STEP_SHIFT : KEY_STEP;
    const dir = event.key === 'ArrowRight' ? 1 : -1;
    // Left panel: ArrowRight widens (+dx). Right panel: its inner edge is on
    // the left, so ArrowRight narrows it (−dx).
    onDelta(side === 'left' ? dir * step : -dir * step);
    onResizeEnd();
  };

  return (
    <Handle
      $side={side}
      $active={active}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      title="Drag to resize · double-click to hide"
      tabIndex={0}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        dragging.current = true;
        lastX.current = event.clientX;
        setActive(true);
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        onDelta(event.clientX - lastX.current);
        lastX.current = event.clientX;
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onDoubleClick={() => onCollapse()}
      onKeyDown={handleKeyDown}
    />
  );
}
