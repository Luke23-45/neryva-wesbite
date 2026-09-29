import styled from 'styled-components';

/**
 * Credentials panel — redesigned.
 *
 * A credential fingerprint list where each row reads as a managed secret:
 * elevated rows, real flag presence, and rotate/revoke forms that feel
 * like deliberate ceremony rather than nested widgets.
 */

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const CredRow = styled.div<{ $revoked?: boolean }>`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: ${({ $revoked }) => ($revoked ? 0.85 : 1)};
`;

export const CredHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const CredName = styled.span`
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CredMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
`;

export const CredFlag = styled.span<{ $tone: 'red' | 'amber' | 'muted' | 'info' }>`
  font-size: 11px;
  font-weight: 650;
  padding: 3px 10px;
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
  gap: 4px 16px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

export const TextButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.status.info.fg};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;

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
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  background: ${({ theme }) => theme.app.bg.base};
  margin-top: 4px;
`;

export const FormNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
`;

export const CheckRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
  cursor: pointer;

  input {
    margin-top: 3px;
    width: 16px;
    height: 16px;
    accent-color: ${({ theme }) => theme.app.status.error.fg};
  }
`;

export const DeniedNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.65;
  padding: 16px 18px;
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const Counter = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.ghost};
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

export const FieldLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const Select = styled.select`
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
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
