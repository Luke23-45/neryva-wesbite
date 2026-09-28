import styled, { css } from 'styled-components';
import type { SlotStatus } from '../../lib/slot-model';

/**
 * v10 node card (agent-builder-v10 §3 V3, adjustment A3): 200×100, flat
 * #141924, uniform 1px #262F3F border for EVERY status — status semantics
 * live in the chip only, never in tinted borders. Ghost cards (untouched /
 * locked / empty) keep the dashed-border rule and are never red.
 */

export const NodeWrap = styled.div`
  position: relative;
  width: 200px;
  height: 100px;
`;

/**
 * Selection is deliberately quiet: no overlay, no ring, no corner chrome.
 * A selected card keeps its 1px border at the same weight — the border
 * simply lightens to a neutral tone and the card lifts with a soft shadow,
 * like picking a physical card off the desk. Hover stays a whisper beneath
 * it (border nudge only) so selection reads as a deliberate step up.
 */
export const NodeCard = styled.div<{ $ghost: boolean; $locked: boolean; $selected: boolean }>`
  position: relative;
  width: 200px;
  height: 100px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #141924;
  border: 1px solid #262f3f;
  cursor: pointer;
  user-select: none;
  opacity: ${({ $locked }) => ($locked ? 0.55 : 1)};

  ${({ $ghost }) =>
    $ghost &&
    css`
      border-style: dashed;
    `}

  &:hover {
    border-color: #334052;
  }

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: #d7dee8;
      box-shadow:
        0 2px 6px rgba(0, 0, 0, 0.45),
        0 12px 28px rgba(0, 0, 0, 0.4);
    `}

  &:focus-visible {
    outline: 2px solid #e9edf3;
    outline-offset: 2px;
  }
`;

export const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const IconTile = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: ${({ $color }) => `color-mix(in srgb, ${$color} 14%, transparent)`};
  color: ${({ $color }) => $color};
`;

export const EmptyGlyph = styled.span`
  font-size: 14px;
  line-height: 1;
  font-weight: 600;
`;

export const NodeTitle = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #e9edf3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const TitleText = styled.span`
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const LockGlyph = styled.span`
  display: inline-flex;
  color: #7c8698;
  flex: none;
`;

export const StatusIconWrap = styled.span`
  display: inline-flex;
  flex: none;
  width: 14px;
  height: 14px;
  svg {
    display: block;
    width: 14px;
    height: 14px;
  }
  /* The syncing icon represents an ongoing process — a gentle rotation is
     honest motion. Frozen under prefers-reduced-motion. */
  &[data-spin='true'] svg {
    animation: nrv-status-spin 2.6s linear infinite;
  }
  @keyframes nrv-status-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    &[data-spin='true'] svg {
      animation: none;
    }
  }
`;

export const Divider = styled.div`
  height: 1px;
  background: #1e2634;
  margin: 8px 0;
`;

export const NodeSubtitle = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: #c3ccd9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const NodeHint = styled.div`
  margin-top: 2px;
  font-size: 10px;
  color: #7c8698;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * 8px status dot for inspector sections. Colors follow the v10 chip
 * vocabulary (SlotNode chipFor) — flat, never theme-derived — so dots in
 * Brain/Guardrails/Knowledge/Tools read the same status language as the
 * canvas chips.
 */
export const StatusDot = styled.span<{ $status: SlotStatus }>`
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: ${({ $status }) =>
    $status === 'ready'
      ? '#3DD68C'
      : $status === 'attention' || $status === 'error'
        ? '#F5A524'
        : $status === 'info' || $status === 'skipped'
          ? '#8B94A3'
          : 'transparent'};
  border: 1.5px solid
    ${({ $status }) =>
      $status === 'ready' ? '#3DD68C' : $status === 'attention' || $status === 'error' ? '#F5A524' : '#8B94A3'};
`;

export const GearButton = styled.button`
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #7c8698;
  cursor: pointer;

  &:hover {
    color: #c3ccd9;
    background: #ffffff12;
  }

  &:focus-visible {
    outline: 2px solid #2f7fe0;
    outline-offset: 1px;
  }
`;

/**
 * Dock port: a small dot on the card edge (palette filter affordance).
 * Only rendered where the projector supplies a portColor — never added to
 * nodes that never had one (C5).
 */
export const PortDot = styled.button`
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  padding: 0;
  background: #0a0d12;
  border: 1.5px solid #5a6880;
  cursor: crosshair;

  &:hover {
    border-color: #8b94a3;
  }

  &:focus-visible {
    outline: 2px solid #2f7fe0;
    outline-offset: 2px;
  }
`;

export const PortDotInner = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #5a6880;
`;
