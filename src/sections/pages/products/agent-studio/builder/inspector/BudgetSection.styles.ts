import styled, { keyframes } from 'styled-components';
import { RailCard } from '../section-ui/SectionPage.styles';

/**
 * Budget section — SVG redesign (2026-10-01).
 *
 * Three group cards (Caps, Estimate, When a cap breaks) with per-run limit
 * rows, a derived worst-case estimate from the primary model's list rate,
 * and the fail-closed law. Flat console colors; no gradients.
 */

export {
  GroupCard,
  CardHead,
  CardIcon,
  CardTitle,
  CardTitleWrap,
  CardSub,
  RailDot,
  RailLabel,
  RailRow,
  RailValue,
  TextButton,
} from './ToolsSection.styles';
export { RailCard, RailTitle } from '../section-ui/SectionPage.styles';
export { MicroTip } from '../section-ui/SectionPage';

/* ── Header pill ─────────────────────────────────────────────────── */

const railPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
`;

/** Rail loading state — flat pulse text, motion-safe, announced via the
 *  parent's aria-busy. */
export const RailLoading = styled.span`
  color: ${({ theme }) => theme.app.text.muted};
  animation: ${railPulse} 1.6s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Pill = styled.span<{ $tone?: 'neutral' | 'warning' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px6};
  padding: ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  white-space: nowrap;
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'warning' ? theme.app.status.warning.border : theme.app.border.default};
  background: ${({ theme, $tone }) =>
    $tone === 'warning' ? theme.app.status.warning.bg : theme.app.surface.subtle};
  color: ${({ theme, $tone }) =>
    $tone === 'warning' ? theme.app.status.warning.fg : theme.app.text.secondary};
`;

export const PillDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
`;

/* ── Cap rows (label + helper left, input + badge right) ─────────── */

export const CapRowWrap = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  flex-wrap: wrap;
`;

export const CapText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};
  min-width: 0;
  flex: 1 1 220px;
`;

export const CapLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const CapHelper = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const CapControl = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
  flex: none;
`;

export const CapInput = styled.div`
  width: ${({ theme }) => theme.app.fieldWidth.numeric};
`;

export const RowDivider = styled.hr`
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.app.border.subtle};
  margin: ${({ theme }) => theme.spacing.s3} 0;
`;

export const CardFootnote = styled.p`
  margin: ${({ theme }) => theme.spacing.s3} 0 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/* ── Badges & chips ──────────────────────────────────────────────── */

export const Badge = styled.span<{ $tone?: 'warning' | 'danger' | 'ok' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.px10};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  white-space: nowrap;
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'warning'
        ? theme.app.status.warning.border
        : $tone === 'danger'
          ? theme.app.status.error.border
          : theme.app.border.default};
  background: ${({ theme, $tone }) =>
    $tone === 'warning'
      ? theme.app.status.warning.bg
      : $tone === 'danger'
        ? theme.app.status.error.bg
        : theme.app.surface.subtle};
  color: ${({ theme, $tone }) =>
    $tone === 'warning'
      ? theme.app.status.warning.fg
      : $tone === 'danger'
        ? theme.app.status.error.fg
        : $tone === 'ok'
          ? theme.app.status.success.fg
          : theme.app.text.secondary};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.s2};
  justify-content: flex-end;
`;

export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.px10};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  white-space: nowrap;
`;

export const ModelChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.px10};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-family: ui-monospace, Menlo, monospace;
  color: ${({ theme }) => theme.app.text.secondary};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  white-space: nowrap;
`;

/* ── Estimate rows ───────────────────────────────────────────────── */

export const EstimateRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  flex-wrap: wrap;
`;

export const EstimateLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const EstimateValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const UsageLink = styled.button`
  background: none;
  border: 0;
  padding: 0 4px;
  /* 44px hit area without changing the visual design — the text stays
   * body-size, vertically centered in the taller target. */
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.status.info.fg};
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
`;

/* ── Read-only rows (fail-closed group) ──────────────────────────── */

export const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  flex-wrap: wrap;
`;

export const InfoLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const InfoValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

/* ── Rail fail-closed tip ────────────────────────────────────────── */

export { RailCard as TipRailCard };
