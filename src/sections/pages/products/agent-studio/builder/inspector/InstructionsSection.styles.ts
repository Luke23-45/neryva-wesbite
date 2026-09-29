import styled from 'styled-components';

/**
 * Instructions section — redesigned.
 *
 * This module also owns the shared section primitives (Wrap, SectionLabel,
 * EmptyState, Whisper, CounterRow) consumed across the builder: they carry
 * the new design language so every section inherits it.
 */

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s6};
  max-width: ${({ theme }) => theme.containers.prose};
  padding-top: ${({ theme }) => theme.spacing.s2};
`;

/** Shared label — sentence case, 600 weight. Micro-caps read as admin UI. */
export const SectionLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.text.secondary};
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s2};
`;

/* ── Shared field anatomy ────────────────────────────────────────
 * Every section's field block: title + helper microcopy above the
 * control. One source of truth for the builder's field rhythm. */

export const FieldBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const FieldHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};
`;

export const FieldTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const FieldHelper = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const MicroCount = styled.span`
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

/* ── Composer block groups ─────────────────────────────────────── */

export const BlockGroup = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const BlockNumber = styled.span`
  flex: none;
  width: ${({ theme }) => theme.app.iconSize.md};
  height: ${({ theme }) => theme.app.iconSize.md};
  border-radius: ${({ theme }) => theme.radii.round};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.muted};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const BlockTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const BlockSub = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const BlockCount = styled.span`
  margin-left: auto;
  flex: none;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const BlockCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};

  &:focus-within {
    border-color: ${({ theme }) => theme.app.border.strong};
  }
`;

export const CustomCard = styled(BlockCard)`
  border-left: 3px solid ${({ theme }) => theme.app.status.warning.fg};
`;

export const RuleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const RuleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.s2}
    ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.s1};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid transparent;

  &:hover {
    background: ${({ theme }) => theme.app.surface.subtle};
    border-color: ${({ theme }) => theme.app.border.default};
  }

  &:focus-within {
    background: ${({ theme }) => theme.app.surface.subtle};
    border-color: ${({ theme }) => theme.app.border.strong};
  }
`;

export const RuleInputWrap = styled.div`
  flex: 1;
  min-width: 0;
`;

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.app.iconSize.lg};
  height: ${({ theme }) => theme.app.iconSize.lg};
  flex: none;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const AddRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s4};
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing.s1};
`;

export const AddButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.status.info.fg};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  font-family: inherit;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.s1};
  border-radius: ${({ theme }) => theme.radii.sm};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px6};

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const AddHint = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const Whisper = styled.div<{ $tone: 'amber' | 'red' }>`
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s4};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'amber' ? theme.app.status.warning.border : theme.app.status.error.border};
  background: ${({ theme, $tone }) =>
    $tone === 'amber' ? theme.app.status.warning.bg : theme.app.status.error.bg};
  color: ${({ theme, $tone }) =>
    $tone === 'amber' ? theme.app.status.warning.fg : theme.app.status.error.fg};
`;

export const CounterRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s2};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const BudgetBar = styled.div`
  height: ${({ theme }) => theme.spacing.px6};
  border-radius: ${({ theme }) => theme.radii.xs};
  background: ${({ theme }) => theme.app.surface.active};
  overflow: hidden;
  margin-top: ${({ theme }) => theme.spacing.s2};
`;

export const BudgetFill = styled.div<{ $ratio: number }>`
  height: 100%;
  width: ${({ $ratio }) => Math.min(100, Math.max(0, $ratio * 100))}%;
  border-radius: ${({ theme }) => theme.radii.xs};
  background: ${({ theme, $ratio }) =>
    $ratio > 1
      ? theme.app.status.error.fg
      : $ratio >= 0.7
        ? theme.app.status.warning.fg
        : theme.app.status.success.fg};
`;

export const Goldilocks = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  margin-top: ${({ theme }) => theme.spacing.px10};
`;

export const PreviewCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.bg.base};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.s5};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px14};
`;

export const PreviewBlock = styled.button`
  border: 0;
  background: transparent;
  text-align: left;
  padding: 0;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.sm};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const PreviewHeader = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.info.fg};
  margin-bottom: ${({ theme }) => theme.spacing.s1};
`;

export const PreviewText = styled.pre`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.body};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const OverrideBanner = styled.div`
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  border: 1px solid ${({ theme }) => theme.app.status.info.border};
  background: ${({ theme }) => theme.app.status.info.bg};
  color: ${({ theme }) => theme.app.text.secondary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s3};
  flex-wrap: wrap;
`;

export const EmptyState = styled.div`
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.s5};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const ConflictDiff = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
  margin-top: ${({ theme }) => theme.spacing.px10};
`;

export const ConflictPane = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.s3};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const ConflictLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.muted};
  margin-bottom: ${({ theme }) => theme.spacing.s1};
`;

export const ConflictIntro = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const ConflictWarning = styled.p`
  margin: ${({ theme }) => theme.spacing.s3} 0 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.status.error.fg};
`;

export const ConflictText = styled.pre`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.body};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 160px;
  overflow-y: auto;
`;
