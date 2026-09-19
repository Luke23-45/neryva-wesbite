import styled from 'styled-components';

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const SectionLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.app.text.muted};
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`;

export const MicroCount = styled.span`
  font-weight: 400;
  letter-spacing: 0;
  color: ${({ theme }) => theme.app.text.ghost};
  font-variant-numeric: tabular-nums;
`;

export const BlockCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const CustomCard = styled(BlockCard)`
  border-left: 3px solid ${({ theme }) => theme.app.status.warning.fg};
`;

export const RuleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const RuleInputWrap = styled.div`
  flex: 1;
  min-width: 0;
`;

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: none;
  border: 0;
  border-radius: 7px;
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
  gap: 12px;
`;

export const AddButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.status.info.fg};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-family: inherit;
  cursor: pointer;
  padding: 4px 2px;
  border-radius: 6px;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const Whisper = styled.div<{ $tone: 'amber' | 'red' }>`
  border-radius: 10px;
  padding: 10px 12px;
  font-size: ${({ theme }) => theme.app.type.caption};
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
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.app.surface.active};
  overflow: hidden;
`;

export const BudgetFill = styled.div<{ $ratio: number }>`
  height: 100%;
  width: ${({ $ratio }) => Math.min(100, Math.max(0, $ratio * 100))}%;
  border-radius: 2px;
  background: ${({ theme, $ratio }) =>
    $ratio > 1
      ? theme.app.status.error.fg
      : $ratio >= 0.7
        ? theme.app.status.warning.fg
        : theme.app.status.success.fg};
`;

export const Goldilocks = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.ghost};
  line-height: 1.55;
`;

export const PreviewCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.bg.base};
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.app.status.info.fg};
  margin-bottom: 2px;
`;

export const PreviewText = styled.pre`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.body};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const OverrideBanner = styled.div`
  border-radius: 10px;
  padding: 10px 12px;
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.55;
  border: 1px solid ${({ theme }) => theme.app.status.info.border};
  background: ${({ theme }) => theme.app.status.info.bg};
  color: ${({ theme }) => theme.app.text.secondary};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const EmptyState = styled.div`
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 12px;
  padding: 14px;
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
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.app.text.muted};
  margin-bottom: 4px;
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
