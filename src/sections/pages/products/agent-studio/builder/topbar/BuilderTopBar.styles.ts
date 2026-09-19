import styled from 'styled-components';

export const Bar = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 16px;
  background: ${({ theme }) => theme.app.bg.raised};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  flex: none;
`;

export const AgentName = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40vw;
`;

export const Pills = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Spacer = styled.div`
  flex: 1;
`;

export const SaveState = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
`;

export const SaveDot = styled.span<{ $busy: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ theme, $busy }) => ($busy ? theme.app.status.warning.fg : theme.app.status.success.fg)};
`;

export const RoomLink = styled.a`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.status.info.fg};
  text-decoration: none;
  white-space: nowrap;
  padding: 6px 4px;
  border-radius: 8px;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;
