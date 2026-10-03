import styled from 'styled-components';

/**
 * Section page shell styles — the shared anatomy behind the Instructions,
 * Role, and Brand pages: page header, field groups, and the right rail.
 */

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s5};
  max-width: 980px;
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s4} ${({ theme }) => theme.spacing.s8};
`;

/* ── Page header ─────────────────────────────────────────────── */

export const PageHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const TitleCluster = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  min-width: 0;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
  white-space: nowrap;
`;

/** Progress pill — "N of M complete". Success colorway on dark. */
export const ProgressPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.status.success.fg};
  background: ${({ theme }) => theme.app.status.success.bg};
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
`;

export const PillDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.app.status.success.fg};
`;

export const PageSubtitle = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.secondary};
  max-width: 640px;
`;

/* ── Body: main column + right rail ──────────────────────────── */

export const Body = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.s6};
`;

export const Main = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s6};
`;

export const Rail = styled.aside`
  flex: 0 0 232px;
  width: 232px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s4};
  position: sticky;
  top: ${({ theme }) => theme.spacing.s4};

  @media (max-width: 1080px) {
    display: none;
  }
`;

/* ── Field groups ────────────────────────────────────────────── */

export const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const GroupHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const GroupLabel = styled.span`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
`;

export const GroupRule = styled.span`
  flex: 1;
  height: 1px;
  background: ${({ theme }) => theme.app.border.default};
`;

export const GroupDescription = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

/* ── Right rail cards ────────────────────────────────────────── */

export const RailCard = styled.div`
  background: ${({ theme }) => theme.app.bg.raised};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const RailTitle = styled.h3`
  margin: 0;
  font-size: 12px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const OutlineList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
`;

export const OutlineRow = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const OutlineLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const OutlineMeta = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  white-space: nowrap;
`;


export const OutlineButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: left;
  border-radius: 4px;

  &:hover ${OutlineLabel} {
    color: ${({ theme }) => theme.app.text.primary};
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
  }
`;

/* ── Context budget ──────────────────────────────────────────── */

export const BudgetBar = styled.div`
  height: 6px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.surface.tint};
  overflow: hidden;
`;

export const BudgetFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => Math.min(100, Math.max(0, $pct))}%;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.status.info.fg};
  transition: width 0.25s ease;
`;

export const BudgetTotal = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const BudgetNumber = styled.span`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const BudgetRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 2px;
`;

export const BudgetRowLine = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const BudgetRowValue = styled.span`
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const BudgetNote = styled.p`
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.muted};
`;

/* ── Micro tip ───────────────────────────────────────────────── */

export const TipCard = styled(RailCard)`
  flex-direction: row;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const TipIcon = styled.span`
  flex: 0 0 auto;
  display: inline-flex;
  color: ${({ theme }) => theme.app.status.warning.fg};
  margin-top: 1px;
`;

export const TipText = styled.p`
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.secondary};

  strong {
    color: ${({ theme }) => theme.app.text.primary};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
  }
`;

/* ── Save state row (kept under the page, next to the bottom bar) ── */

export const SaveRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  padding-top: ${({ theme }) => theme.spacing.s2};
`;

export const Whisper = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

export const WhisperError = styled(Whisper)`
  color: ${({ theme }) => theme.app.status.error.fg};
`;
