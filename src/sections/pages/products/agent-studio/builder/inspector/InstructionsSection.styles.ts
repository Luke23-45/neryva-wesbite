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
  gap: 28px;
  max-width: 720px;
  padding-top: 8px;
`;

/** Shared label — sentence case, 600 weight. Micro-caps read as admin UI. */
export const SectionLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.secondary};
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`;

/* ── Shared field anatomy ────────────────────────────────────────
 * Every section's field block: title + helper microcopy above the
 * control. One source of truth for the builder's field rhythm. */

export const FieldBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const FieldHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const FieldTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const FieldHelper = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

export const MicroCount = styled.span`
  font-weight: 400;
  letter-spacing: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;

/* ── Composer block groups ─────────────────────────────────────── */

export const BlockGroup = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const BlockNumber = styled.span`
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.muted};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const BlockTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const BlockSub = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 400;
  color: ${({ theme }) => theme.app.text.muted};
  letter-spacing: 0;
`;

export const BlockCount = styled.span`
  margin-left: auto;
  flex: none;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;

export const BlockCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;

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
  gap: 8px;
`;

export const RuleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 4px;
  border-radius: 12px;
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
  width: 32px;
  height: 32px;
  flex: none;
  border: 0;
  border-radius: 9px;
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
  gap: 16px;
  align-items: center;
  padding-top: 4px;
`;

export const AddButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.status.info.fg};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  padding: 6px 4px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const AddHint = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

export const Whisper = styled.div<{ $tone: 'amber' | 'red' }>`
  border-radius: 12px;
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.55;
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
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;

export const BudgetBar = styled.div`
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.app.surface.active};
  overflow: hidden;
  margin-top: 8px;
`;

export const BudgetFill = styled.div<{ $ratio: number }>`
  height: 100%;
  width: ${({ $ratio }) => Math.min(100, Math.max(0, $ratio * 100))}%;
  border-radius: 3px;
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
  line-height: 1.55;
  margin-top: 10px;
`;

export const PreviewCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.bg.base};
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const PreviewBlock = styled.button`
  border: 0;
  background: transparent;
  text-align: left;
  padding: 0;
  cursor: pointer;
  border-radius: 8px;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const PreviewHeader = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 650;
  color: ${({ theme }) => theme.app.status.info.fg};
  margin-bottom: 4px;
`;

export const PreviewText = styled.pre`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12.5px;
  line-height: 1.65;
  color: ${({ theme }) => theme.app.text.body};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const OverrideBanner = styled.div`
  border-radius: 12px;
  padding: 14px 16px;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.55;
  border: 1px solid ${({ theme }) => theme.app.status.info.border};
  background: ${({ theme }) => theme.app.status.info.bg};
  color: ${({ theme }) => theme.app.text.secondary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const EmptyState = styled.div`
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 14px;
  padding: 20px 22px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ConflictDiff = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
`;

export const ConflictPane = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.55;
`;

export const ConflictLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.muted};
  margin-bottom: 4px;
`;

export const ConflictIntro = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.65;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const ConflictWarning = styled.p`
  margin: 12px 0 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.6;
  color: ${({ theme }) => theme.app.status.error.fg};
`;

export const ConflictText = styled.pre`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.body};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 160px;
  overflow-y: auto;
`;
