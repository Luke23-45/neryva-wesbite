import styled, { css } from 'styled-components';
import { SPEC_BLUE, SPEC_LINK } from '../BlockCard.styles';
import { TINT_BODY } from './markdown-tint';

/**
 * Block editor styles — the focused editing view (SVG state A).
 * The editor replaces the section page in place: no modal, no route change.
 */

/* Shared surface metrics — the highlight <pre> and the transparent
 * <textarea> MUST match exactly or the tint drifts from the caret. */
const surfaceMetrics = css`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  line-height: 1.7;
  padding: 16px;
  margin: 0;
  border: 0;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
  tab-size: 2;
`;

export const EditorWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 720px;
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s4} ${({ theme }) => theme.spacing.s8};
`;

/* ── Sub-header ──────────────────────────────────────────────── */

export const SubHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  flex-wrap: wrap;
`;

export const BackLink = styled.button`
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 13px;
  color: ${SPEC_LINK};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
    border-radius: 4px;
  }
`;

export const SubDivider = styled.span`
  width: 1px;
  height: 16px;
  background: ${({ theme }) => theme.app.border.strong};
  flex: 0 0 auto;
`;

export const BlockTitle = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
  white-space: nowrap;
`;

/** "Unsaved changes" — warning colorway. */
export const UnsavedPill = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.app.status.warning.fg};
  background: ${({ theme }) => theme.app.status.warning.bg};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
`;

export const SubSpacer = styled.span`
  flex: 1;
`;

export const SaveCloseButton = styled.button`
  border: 0;
  border-radius: 6px;
  background: ${SPEC_BLUE};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: 12px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  padding: 7px 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: filter ${({ theme }) => theme.transitions.fast};

  &:hover {
    filter: brightness(1.12);
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
    filter: none;
  }
`;

/* ── Toolbar ─────────────────────────────────────────────────── */

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const ToolButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
  }
`;

export const ToolDivider = styled.span`
  width: 1px;
  height: 16px;
  background: ${({ theme }) => theme.app.border.default};
  margin: 0 4px;
  flex: 0 0 auto;
`;

/* ── Writing surfaces ────────────────────────────────────────── */

export const SurfaceWrap = styled.div`
  position: relative;
  height: 360px;
  background: ${({ theme }) => theme.app.bg.base};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const HighlightPre = styled.pre`
  ${surfaceMetrics}
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: ${TINT_BODY};
  pointer-events: none;
  user-select: none;
`;

export const SurfaceTextarea = styled.textarea`
  ${surfaceMetrics}
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  color: transparent;
  caret-color: ${({ theme }) => theme.app.text.primary};
  resize: none;
  overflow-y: auto;
  outline: none;

  &::selection {
    background: ${({ theme }) => theme.app.border.focus};
  }

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }

  /* Thin scrollbars stay out of the way while writing. */
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.app.border.strong} transparent;
`;

/** Plain (raw) surface — untinted, same metrics. */
export const PlainTextarea = styled.textarea`
  ${surfaceMetrics}
  display: block;
  width: 100%;
  height: 360px;
  background: ${({ theme }) => theme.app.bg.base};
  color: ${({ theme }) => theme.app.text.body};
  resize: none;
  overflow-y: auto;
  outline: none;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }

  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.app.border.strong} transparent;
`;

/* ── Split view ──────────────────────────────────────────────── */

export const SplitWrap = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const SplitPane = styled.div`
  position: relative;
  height: 360px;
  overflow: hidden;

  &:first-child {
    border-right: 1px solid ${({ theme }) => theme.app.border.default};
  }
`;

export const SplitPreview = styled.div`
  height: 360px;
  overflow-y: auto;
  padding: 16px;
  font-size: 13px;
  line-height: 1.7;
  color: ${({ theme }) => theme.app.text.body};

  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.app.border.strong} transparent;
`;

/* ── Preview view ────────────────────────────────────────────── */

export const PreviewPane = styled.div`
  min-height: 360px;
  padding: 20px 4px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  font-size: 13px;
  line-height: 1.7;
  color: ${({ theme }) => theme.app.text.body};
`;

export const PreviewEmpty = styled.div`
  color: ${({ theme }) => theme.app.text.ghost};
  font-size: 13px;
  padding: 40px 0;
  text-align: center;
`;

/* ── Status bar ──────────────────────────────────────────────── */

export const StatusBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: 10px 2px;
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.muted};
  flex-wrap: wrap;
`;

export const SaveState = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
`;

export const SaveDot = styled.span<{ $pending?: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $pending, theme }) =>
    $pending ? theme.app.status.warning.fg : theme.app.status.success.fg};
  flex: 0 0 auto;
`;

export const Counts = styled.span`
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  white-space: nowrap;
`;

export const CountsOver = styled(Counts)`
  color: ${({ theme }) => theme.app.status.error.fg};
`;

export const StatusSpacer = styled.span`
  flex: 1;
`;

export const Shortcuts = styled.span`
  white-space: nowrap;
  color: ${({ theme }) => theme.app.text.faint};

  kbd {
    font-family: inherit;
    font-size: 10px;
    background: ${({ theme }) => theme.app.surface.tint};
    border: 1px solid ${({ theme }) => theme.app.border.default};
    border-radius: 4px;
    padding: 1px 5px;
  }
`;

export const WhisperLine = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.status.error.fg};
  padding: 8px 2px;
  line-height: 1.5;
`;

/* ── Optional single-line title field (examples) ─────────────── */

export const TitleFieldPad = styled.div`
  padding: 12px 2px 0;
  max-width: 460px;
`;
