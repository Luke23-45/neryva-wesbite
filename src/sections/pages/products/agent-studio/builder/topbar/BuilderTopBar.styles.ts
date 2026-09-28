import styled from 'styled-components';

/**
 * v10 topbar (ledger T1–T12, A1): 56px bar, flat colors only — no gradients
 * anywhere on this surface (C1). Hexes are pinned to the v10 spec rather than
 * theme tokens so the bar renders identically regardless of theme tweaks.
 */
export const Bar = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 16px;
  background: #0e1218;
  border-bottom: 1px solid #1e2530;
  flex: none;
`;

/** Logo mark (T1): flat #2F7FE0 rounded square, white glyph. Static — not a
 * button or link (A1: absolutely no gradient). */
export const LogoMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #2f7fe0;
  flex: none;
`;

export const Wordmark = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #e9edf3;
  white-space: nowrap;
  letter-spacing: 0.01em;
`;

/** Breadcrumb (T3): read-only org · Agents crumb; identity is write-once. */
export const Breadcrumb = styled.nav`
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
`;

export const Crumb = styled.span`
  font-size: 11px;
  color: #7c8698;
  white-space: nowrap;
`;

export const AgentName = styled.h1`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #e9edf3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40vw;
`;

export const Pills = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Spacer = styled.div`
  flex: 1;
`;

export const SaveState = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: #a6b0bf;
  white-space: nowrap;
`;

export const SaveDot = styled.span<{ $busy: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ theme, $busy }) => ($busy ? theme.app.status.warning.fg : theme.app.status.success.fg)};
`;

/** Test-run button (T9, build mode only): dark secondary action. Calls
 * onTestRun — the same Try-node flow, never a second implementation. */
export const TestRunButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  background: #121820;
  border: 1px solid #2a3342;
  color: #c6ceda;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  flex: none;

  &:hover:not(:disabled) {
    border-color: #3d4a61;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #2f7fe0;
    outline-offset: 1px;
  }
`;

/** Publish button (T10, build mode only): flat primary; never disabled in
 * build mode — clicking while blocked opens the issues surface (the
 * coordinator wires that). Flat #2F7FE0 per A1. */
export const PublishButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: #2f7fe0;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  flex: none;

  &:hover {
    background: #2b72c9;
  }

  &:focus-visible {
    outline: 2px solid #8ab8f2;
    outline-offset: 1px;
  }
`;

export const PublishWrap = styled.span`
  position: relative;
  display: inline-flex;
  flex: none;
`;

/** Live blocking-issue count badge; rendered only when blockingCount > 0. */
export const PublishBadge = styled.span`
  position: absolute;
  top: -7px;
  right: -7px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #f5a524;
  color: #14181f;
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

export const RoomLink = styled.a`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.status.info.fg};
  text-decoration: none;
  white-space: nowrap;
  padding: 6px 4px;
  border-radius: 8px;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;
