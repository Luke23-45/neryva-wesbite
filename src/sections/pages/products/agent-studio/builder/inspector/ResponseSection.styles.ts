import styled from 'styled-components';
import { RailCard } from '../section-ui/SectionPage.styles';

/**
 * Response section — SVG redesign (2026-10-01).
 *
 * Three group cards (Presentation, Channels, Generation overrides) with
 * iOS-style segmented controls, per-channel override rows, an inheriting/
 * overridden toggle for the Model-shared pair, and a legacy-field save
 * blocker. Flat console colors; no gradients.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';
export { SwitchRow, SwitchText, SwitchTitle, SwitchSub } from './ModelSection.styles';

/* ── Header pill ─────────────────────────────────────────────────── */

export const Pill = styled.span<{ $tone?: 'neutral' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px6};
  padding: ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.px12};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  white-space: nowrap;
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'danger' ? theme.app.status.error.border : theme.app.border.default};
  background: ${({ theme, $tone }) =>
    $tone === 'danger' ? theme.app.status.error.bg : theme.app.surface.subtle};
  color: ${({ theme, $tone }) =>
    $tone === 'danger' ? theme.app.status.error.fg : theme.app.text.secondary};
`;

export const PillDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
`;

/* ── Control rows (label + helper left, control right) ───────────── */

export const ControlRow = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: ${({ $compact }) => ($compact ? 'center' : 'flex-start')};
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  flex-wrap: wrap;
`;

export const ControlText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px4};
  min-width: 0;
  flex: 1 1 220px;
`;

export const ControlLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ControlHelper = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/* ── Channel rows ────────────────────────────────────────────────── */

export const ChannelRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  flex-wrap: wrap;
`;

export const ChannelText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px4};
  min-width: 0;
  flex: 1 1 200px;
`;

export const ChannelFootnote = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

/** Dims a control that cannot apply (buffered channels ignore streaming). */
export const DisabledVeil = styled.div<{ $disabled?: boolean }>`
  ${({ $disabled }) =>
    $disabled
      ? `
    opacity: 0.45;
    pointer-events: none;
  `
      : ''};
`;

/* ── Inherit / override ──────────────────────────────────────────── */

export const InheritRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  flex-wrap: wrap;
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.px8};
  margin-top: ${({ theme }) => theme.spacing.px6};
`;

export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.px4} ${({ theme }) => theme.spacing.px10};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  white-space: nowrap;
`;

/* ── Legacy blocker ──────────────────────────────────────────────── */

export const BlockerCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.error.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.app.status.error.bg};
  padding: ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px8};
`;

export const BlockerTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.error.fg};
`;

export const BlockerMessage = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const BlockerPath = styled.code`
  font-family: ui-monospace, Menlo, monospace;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.status.error.fg};
`;

export const BlockerButton = styled.button`
  align-self: flex-start;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.px8} ${({ theme }) => theme.spacing.px16};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-family: inherit;
  cursor: pointer;
  border: 0;
  /* Flat iOS blue for the primary remove action (matches the SVG spec). */
  background: #0a84ff;
  color: #fff;

  &:hover {
    background: #0077ed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const BlockerRailCard = styled(RailCard)`
  border-color: ${({ theme }) => theme.app.status.error.border};
`;

/* ── Read-only rows ──────────────────────────────────────────────── */

export const ReadRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: ${({ theme }) => theme.spacing.px8} 0;
`;

export const ReadLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ReadValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  text-align: right;
`;

export const RowDivider = styled.hr`
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.app.border.subtle};
  margin: ${({ theme }) => theme.spacing.px4} 0;
`;

/* ── Humanized save-failure toast ────────────────────────────────── */

export const SaveToast = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  min-width: 280px;
  max-width: 420px;
`;

export const SaveToastBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px2};
  flex: 1 1 auto;
  min-width: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const SaveToastTitle = styled.span`
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const SaveToastActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px4};
  flex: none;
`;
