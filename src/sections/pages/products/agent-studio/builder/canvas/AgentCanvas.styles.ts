import styled from 'styled-components';

/**
 * v10 canvas chrome (agent-builder-v10 §3 V1/V9): flat tokens, no gradients.
 * Canvas #0A0D12; toolbar #12161D / #232B39; minimap #10141B.
 */

export const CanvasWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  background: #0a0d12;

  /* React Flow dark chrome (scoped — the library ships light defaults). */
  .react-flow__attribution {
    background: transparent;
    color: #7c8698;
  }

  .react-flow__node:focus-visible {
    outline: none;
  }
`;

export const Toolbar = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 2px;
  height: 36px;
  padding: 0 6px;
  border-radius: 10px;
  border: 1px solid #232b39;
  background: #12161d;
`;

export const ToolbarDivider = styled.div`
  width: 1px;
  height: 18px;
  margin: 0 6px;
  background: #232b39;
  flex: none;
`;

export const ToolButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: ${({ $active }) => ($active ? '#58A6FF' : '#A6B0BF')};
  font-size: 12px;
  font-weight: 550;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #ffffff10;
    color: ${({ $active }) => ($active ? '#58A6FF' : '#E9EDF3')};
  }

  &:focus-visible {
    outline: 2px solid #2f7fe0;
    outline-offset: 1px;
  }
`;

export const ZoomLabel = styled.span`
  min-width: 44px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #7c8698;
  font-variant-numeric: tabular-nums;
  user-select: none;
`;

export const MinimapWrap = styled.div`
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 6px;

  /* React Flow positions the minimap itself; inside our wrapper it lays out
     in normal flow so the caption sits beneath it. */
  .react-flow__minimap {
    position: static;
    margin: 0;
  }
`;

export const MinimapCaption = styled.div`
  text-align: center;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #7c8698;
  user-select: none;
`;

export const CanvasFallback = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c8698;
  font-size: 14px;
`;
