import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { spring } from '@styles/motion';

/**
 * Apple-grade tooltip.
 *
 * Behavior (matches macOS / iPadOS hover tooltips):
 * - Hover/focus the trigger → wait 480ms → tooltip fades + scales in.
 * - Leave trigger → tooltip fades + scales out immediately.
 * - Press Escape → closes.
 * - Pure CSS positioning (top/bottom), no portal — keeps it cheap.
 *
 * Visual:
 * - Frosted-glass bubble (backdrop-filter blur 14px).
 * - Hairline border in `rgba(255,255,255,0.10)` — matches the studio chrome.
 * - Pointer arrow on the bubble edge for visual direction.
 * - Rounded 8px, matches Apple "callout" shape (not the iOS popover's
 *   tighter radius — that's a different control).
 */

type Side = 'top' | 'bottom';

type Props = {
  label: ReactNode;
  children: ReactNode;
  side?: Side;
  /** ms delay before show — defaults to 480, matches macOS tooltips. */
  delay?: number;
};

export function Tooltip({ label, children, side = 'top', delay = 480 }: Props) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const scheduleShow = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(true), delay);
  };

  const cancelShow = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Wrap
      ref={wrapperRef}
      onMouseEnter={scheduleShow}
      onMouseLeave={cancelShow}
      onFocus={scheduleShow}
      onBlur={cancelShow}
    >
      {children}
      <AnimatePresence>
        {open && (
          <Bubble
            role="tooltip"
            $side={side}
            initial={{ opacity: 0, scale: 0.92, y: side === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: side === 'top' ? 2 : -2 }}
            transition={{ ...spring.snap, mass: 0.6 }}
          >
            {label}
            <Arrow $side={side} aria-hidden="true" />
          </Bubble>
        )}
      </AnimatePresence>
    </Wrap>
  );
}

const Wrap = styled.span`
  display: inline-flex;
  position: relative;
`;

const Bubble = styled(motion.div)<{ $side: Side }>`
  position: absolute;
  ${({ $side }) => ($side === 'top' ? 'bottom: calc(100% + 8px);' : 'top: calc(100% + 8px);')}
  left: 50%;
  transform: translateX(-50%);
  z-index: 600;
  padding: 5px 9px;
  border-radius: 8px;
  background: rgba(15, 17, 22, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: rgba(245, 247, 251, 0.95);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  /* GPU layer hint */
  will-change: transform, opacity;
`;

/**
 * The arrow is a 6×6 square rotated 45°. The two borders that survive
 * the rotation are the ones that form the "V" pointing at the trigger.
 *
 *   side: 'top'    → bubble above trigger → arrow points DOWN
 *                    → bottom corner of the square is the point
 *                    → visible borders are bottom + right (the two
 *                      edges meeting at the bottom-right corner of
 *                      the pre-rotation square, which becomes the
 *                      bottom point of the diamond)
 *
 *   side: 'bottom' → bubble below trigger → arrow points UP
 *                    → top corner of the square is the point
 *                    → visible borders are top + left
 */
const Arrow = styled.span<{ $side: Side }>`
  position: absolute;
  left: 50%;
  width: 6px;
  height: 6px;
  background: rgba(15, 17, 22, 0.94);
  ${({ $side }) => {
    if ($side === 'top') {
      // Arrow at the bottom of the bubble, pointing down.
      return `
        bottom: -3px;
        transform: translateX(-50%) rotate(45deg);
        border-right: 1px solid rgba(255, 255, 255, 0.10);
        border-bottom: 1px solid rgba(255, 255, 255, 0.10);
        border-top: 0;
        border-left: 0;
      `;
    }
    // Arrow at the top of the bubble, pointing up.
    return `
      top: -3px;
      transform: translateX(-50%) rotate(45deg);
      border-top: 1px solid rgba(255, 255, 255, 0.10);
      border-left: 1px solid rgba(255, 255, 255, 0.10);
      border-right: 0;
      border-bottom: 0;
    `;
  }}
`;
