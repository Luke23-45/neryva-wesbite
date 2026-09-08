import styled from 'styled-components';

export const EndpointCard = styled.button<{ $selected?: boolean }>`
  border-color: ${({ $selected, theme }) => ($selected ? theme.app.status.lilac.border : undefined)};
  background: ${({ $selected, theme }) => ($selected ? theme.app.status.lilac.bg : undefined)};
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};

  & + & {
    margin-top: 10px;
  }

  cursor: pointer;
  text-align: left;
  width: 100%;`;

export const EndpointLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  margin-bottom: 6px;
`;

export const EndpointBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const EndpointUrl = styled.code`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  word-break: break-all;
`;

export const EndpointMeta = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const EndpointMetaNote = styled.span`
  color: ${({ theme }) => theme.app.text.muted};
`;

