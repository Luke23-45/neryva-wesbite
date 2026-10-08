import styled, { css, keyframes } from 'styled-components';

/**
 * Agent detail chrome (ledger 1.23).
 *
 * Only the atoms other modules import live here — `BackLink`,
 * `ActionCluster` and the `Version*` row primitives are imported by
 * AgentEditor / VersionsPanel / RollbackSection, so they are stable API.
 * Everything else is the view's own vocabulary.
 *
 * Text atoms (`Mono`, `Muted`, `Whisper`, `EmptyNote`, `Tile*`, `Callout`)
 * and the `STATUS_TONE` / `formatVersionLabel` single sources of truth
 * live in ./primitives — they were duplicated six times each.
 */

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  text-decoration: none;
  width: fit-content;
  margin-bottom: -8px;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

export const ActionCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

/**
 * Seprates the constructive actions from the destructive one so a
 * two-icon Delete never reads as a peer of Edit.
 */
export const ActionDivider = styled.span`
  width: 1px;
  align-self: stretch;
  margin: 2px 2px;
  background: ${({ theme }) => theme.app.border.default};
`;

/* ── Identity ──────────────────────────────────────────────────────── */

/** Deliberately unframed: the page title is not a card. */
export const IdentityRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  flex-wrap: wrap;
`;

export const IdentityMain = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  min-width: 0;
  flex: 1;
`;

export const IdentityName = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.titleLg};
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const IdentityDesc = styled.p`
  margin: 4px 0 0;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.muted};
  max-width: 62ch;
`;

/* ── Tabs ──────────────────────────────────────────────────────────── */

/**
 * Sticky so the tab you are reading is always one click away. The band
 * bleeds to the shell gutters and blurs content scrolling underneath,
 * matching the shell Topbar treatment (same 0.7 alpha over app.bg.base).
 * `top` is the documented topbar offset (see ActivityView.styles.ts).
 */
export const TabBar = styled.div`
  position: sticky;
  top: 76px;
  z-index: 5;
  margin: 0 -28px;
  padding: 10px 28px;
  background: rgba(11, 13, 18, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};

  ${({ theme }) => theme.media.mobile} {
    margin: 0 -18px;
    padding: 10px 18px;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

/** Clears both sticky bands when the panel is scrolled to. */
export const TabPanel = styled.div`
  scroll-margin-top: 132px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s4};
`;

export const TabIntro = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s3};
  flex-wrap: wrap;
  margin-bottom: -4px;

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.app.type.body};
    color: ${({ theme }) => theme.app.text.muted};
    max-width: 70ch;
  }
`;

/* ── At a glance ───────────────────────────────────────────────────── */

/**
 * Each tile owns exactly one fact and deep-links to the tab that owns the
 * detail — this is what removes the "same value printed five times" wall.
 */
export const SummaryStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(158px, 1fr));
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const SummaryTile = styled.button`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const SummaryValue = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s2};
  min-width: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

/** The truncating element has to be the one that owns the text, not the flex parent. */
export const SummaryText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** Affordance appears on hover/focus only — six resting chevrons is noise. */
export const SummaryChevron = styled.span`
  flex: none;
  color: ${({ theme }) => theme.app.text.ghost};
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  ${SummaryTile}:hover &,
  ${SummaryTile}:focus-visible & {
    opacity: 1;
  }
`;

/* ── Layouts ───────────────────────────────────────────────────────── */

/** auto-fit lands on exactly two columns inside the 1240px ViewShell. */
export const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: ${({ theme }) => theme.spacing.s4};
  align-items: start;
`;

/** Spans both columns — for the tall panels that would otherwise stretch. */
export const Wide = styled.div`
  grid-column: 1 / -1;
`;

/* ── Prompt ────────────────────────────────────────────────────────── */

export const CodeBlock = styled.pre`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s4};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.app.bg.deep};
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.65;
  color: ${({ theme }) => theme.app.text.body};
  white-space: pre-wrap;
  word-break: break-word;
`;

export const PromptBody = styled.div`
  white-space: pre-wrap;
  color: ${({ theme }) => theme.app.text.body};
`;

/* ── Version rows (imported by VersionsPanel — stable API) ─────────── */

export const CurrentTag = styled.span`
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 5px;
  background: ${({ theme }) => theme.app.status.success.bg};
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  color: ${({ theme }) => theme.app.status.success.fg};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const VersionList = styled.div`
  & > * + * {
    border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
  }
`;

const highlightPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

export const VersionRow = styled.div<{ $highlight?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: 12px 22px;
  border-radius: ${({ theme }) => theme.radii.md};
  ${({ $highlight, theme }) =>
    $highlight &&
    css`
      outline: 1px solid ${theme.app.status.info.border};
      background: ${theme.app.status.info.bg};
      animation: ${highlightPulse} 1.6s ease-in-out 2;
    `};
`;

export const VersionMain = styled.div`
  flex: 1;
  min-width: 0;
`;

export const VersionId = styled.div`
  display: flex;
  align-items: center;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.primary};
  word-break: break-all;
`;

export const VersionMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
`;

export const VersionActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.s2};
  flex-shrink: 0;
`;