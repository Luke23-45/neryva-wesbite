import styled from 'styled-components';

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const CredRow = styled.div<{ $revoked?: boolean }>`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 11px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  opacity: ${({ $revoked }) => ($revoked ? 0.85 : 1)};
`;

export const CredHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CredName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CredMeta = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.55;
`;

export const CredFlag = styled.span<{ $tone: 'red' | 'amber' | 'muted' | 'info' }>`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ theme, $tone }) =>
    $tone === 'red'
      ? theme.app.status.error.fg
      : $tone === 'amber'
        ? theme.app.status.warning.fg
        : $tone === 'info'
          ? theme.app.status.info.fg
          : theme.app.text.muted};
  background: ${({ theme, $tone }) =>
    $tone === 'red'
      ? theme.app.status.error.bg
      : $tone === 'amber'
        ? theme.app.status.warning.bg
        : $tone === 'info'
          ? theme.app.status.info.bg
          : theme.app.surface.active};
`;

export const RowActions = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

export const TextButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.status.info.fg};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-family: inherit;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const DangerButton = styled(TextButton)`
  color: ${({ theme }) => theme.app.status.error.fg};
`;

export const InlineForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  background: ${({ theme }) => theme.app.bg.base};
`;

export const FormNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.55;
`;

export const CheckRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
  cursor: pointer;

  input {
    margin-top: 2px;
    accent-color: #f87171;
  }
`;

export const DeniedNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.55;
  padding: 8px 10px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const Counter = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.app.text.ghost};
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

export const FieldLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const Select = styled.select`
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.app.border.focus};
  }
`;

export const SelectWrap = styled.label`
  font-size: ${({ theme }) => theme.app.type.caption};
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
