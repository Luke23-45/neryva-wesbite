import styled from 'styled-components';

/**
 * Guardrails section — SVG redesign.
 *
 * SectionPage shell with four safeguard groups (Screening, PII redaction,
 * Execution mode, Deny topics), each a GroupCard with an icon header.
 * Screening rows use iOS-style Segmented controls; PII is a master Switch
 * with entity-type chips, a redaction-action segmented control, and
 * applies-to chips; execution mode is a Segmented with a live mode hint
 * plus violation-action chips; deny topics is a list with refusal counts
 * and an add row.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';
export { SwitchRow, SwitchText, SwitchTitle, SwitchSub } from './ModelSection.styles';
export { PinMeta } from './KnowledgeSection.styles';

/** Green status pill for the page header — live execution mode + layer count. */
export const ModePill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s1};
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  background: ${({ theme }) => theme.app.status.success.bg};
  color: ${({ theme }) => theme.app.status.success.fg};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  white-space: nowrap;
`;

export const ModePillDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
`;

/** A screening row: label + helper on the left, segmented control right. */
export const ScreenRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  padding: ${({ theme }) => theme.spacing.s1} 0;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const ScreenText = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px2};
`;

export const ScreenLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ScreenHelper = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const ScreenControl = styled.div`
  flex: none;
`;

/** Hairline between screening rows. */
export const RowDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.app.border.hairline};
  margin: ${({ theme }) => theme.spacing.s1} 0;
`;

/** Mode indicator line: dot + word, never color alone. */
export const ModeLine = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.px10};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/** Read-only rows for viewers. */
export const ReadRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  padding: ${({ theme }) => theme.spacing.s2} 0;
`;

export const ReadLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.primary};
  flex: none;
`;

export const ReadValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  text-align: right;
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/* ── PII sub-controls ──────────────────────────────────────────────────── */

/** Sub-section label inside a group card (e.g. "ENTITY TYPES"). */
export const SubLabel = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
  margin: ${({ theme }) => theme.spacing.s3} 0 ${({ theme }) => theme.spacing.s2};
`;

/** Wrapping row of toggle chips. */
export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.s2};
`;

/**
 * Toggle chip — selected is the flat iOS blue (accentControl), unselected
 * is a neutral outline. A real button: keyboard-focusable, aria-pressed.
 */
export const SelectChip = styled.button<{ $selected: boolean }>`
  display: inline-flex;
  align-items: center;
  position: relative;
  padding: ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.pill};
  /* D-BUG3: selected is the neutral light pill (same-section Segmented
     treatment) — never the blue accent fill (no-blue-selection rule). */
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme, $selected }) => ($selected ? theme.app.text.primary : 'transparent')};
  color: ${({ theme, $selected }) =>
    $selected ? theme.app.text.inverse : theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme, $selected }) =>
    $selected ? theme.typography.weights.semibold : theme.typography.weights.medium};
  cursor: pointer;
  transition:
    background 120ms ease,
    border-color 120ms ease,
    color 120ms ease;

  /* D-BUG2: 44px-tall hit area, visual-neutral — the visible chip is unchanged. */
  &::after {
    content: '';
    position: absolute;
    inset: -7px 0;
  }

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

/** Greys a sub-control block when the PII master toggle is off — honest disabled, never decorative. */
export const SubControlBlock = styled.fieldset<{ $disabled: boolean }>`
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
  ${({ $disabled }) => ($disabled ? 'opacity: 0.45; pointer-events: none;' : '')}
`;

/* ── Deny topics ───────────────────────────────────────────────────────── */

export const TopicList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

export const TopicRow = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: ${({ theme }) => theme.spacing.s2} 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};

  &:last-child {
    border-bottom: 0;
  }
`;

export const TopicName = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** Read-only refusal count — real telemetry, never invented. Absent when unknown. */
export const TopicCount = styled.span`
  flex: none;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  white-space: nowrap;
`;

export const TopicRemove = styled.button`
  flex: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: 16px;
  line-height: 1;
  cursor: pointer;

  /* D-BUG2: 44px hit area, visual-neutral — the visible × stays 24px. */
  &::after {
    content: '';
    position: absolute;
    inset: -10px;
  }

  &:hover {
    background: ${({ theme }) => theme.app.status.error.bg};
    color: ${({ theme }) => theme.app.status.error.fg};
  }
`;

export const TopicAddRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s2};
  margin-top: ${({ theme }) => theme.spacing.s3};
  align-items: stretch;
`;

export const TopicInput = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }
`;

export const TopicAddButton = styled.button`
  flex: none;
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s4};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.app.accentControl};
  background: ${({ theme }) => theme.app.accentControl};
  /* D-BUG4: near-white token — the fill is the blue accent, so text.inverse
     (#0b0d12) would fail contrast; text.primary is the light-on-fill token. */
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
