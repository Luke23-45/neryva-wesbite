import styled from 'styled-components';

/**
 * Resize handle (ledger T15): a 9px invisible hit area straddling the panel's
 * inner border (left panel: right:-4px; right panel: left:-4px), full height,
 * `cursor: ew-resize`. At rest the sidebar's own 1px border shows through;
 * on hover / keyboard focus / drag a 2px flat #2F7FE0 line appears centered.
 * Flat colors only. Hidden at the tablet breakpoint (≤1024px) — collapse and
 * restore still work there, only the drag handle is gone.
 */
export const Handle = styled.div<{ $side: 'left' | 'right'; $active: boolean }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 9px;
  ${({ $side }) => ($side === 'left' ? 'right: -4px;' : 'left: -4px;')}
  cursor: ew-resize;
  z-index: 5;
  display: flex;
  justify-content: center;
  /* Pointer events drive the drag — never let touch scroll steal it. */
  touch-action: none;

  &::after {
    content: '';
    width: 2px;
    height: 100%;
    background: transparent;
    /* Pinned (not theme.transitions.fast): this handle also renders in
       theme-less test trees — styled-components falls back to an empty
       theme there, and a missing token would throw. */
    transition: background 160ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover::after,
  &:focus-visible::after {
    background: #2f7fe0;
  }

  ${({ $active }) =>
    $active &&
    `
    &::after {
      background: #2f7fe0;
    }
  `}

  &:focus-visible {
    outline: none;
  }

  /* Pinned (not theme.media.tablet): this handle also renders in theme-less
     test trees — styled-components falls back to an empty theme there, and
     a missing token would throw. 1024px matches the tablet breakpoint. */
  @media (max-width: 1024px) {
    display: none;
  }
`;
