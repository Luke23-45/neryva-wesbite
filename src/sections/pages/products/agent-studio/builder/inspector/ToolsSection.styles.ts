import styled from 'styled-components';

export const ToolCard = styled.div<{ $tone: 'ok' | 'attention' | 'info' | 'error' }>`
  border: 1px solid
    ${(props) =>
      props.$tone === 'ok'
        ? props.theme.app.border.default
        : props.$tone === 'attention'
          ? props.theme.app.status.warning.border
          : props.$tone === 'error'
            ? props.theme.app.status.error.border
            : props.theme.app.status.info.border};
  background: ${(props) =>
    props.$tone === 'ok'
      ? props.theme.app.surface.subtle
      : props.$tone === 'attention'
        ? props.theme.app.status.warning.bg
        : props.$tone === 'error'
          ? props.theme.app.status.error.bg
          : props.theme.app.status.info.bg};
  border-radius: 11px;
  padding: 10px 12px;
  margin-top: 6px;
`;

export const ToolHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ToolTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ToolState = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.app.type.caption};
  white-space: nowrap;
`;

export const ToolMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: 4px;
`;

export const ToolFix = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  margin-top: 4px;
`;

export const ToolActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 6px;
`;

export const TextButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.status.info.fg};
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export const MutedButton = styled(TextButton)`
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const FilterRow = styled.div`
  margin-top: 8px;
`;

export const RowGrid = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 8px;
`;

export const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

export const ControlLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
`;
