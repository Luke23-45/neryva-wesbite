import styled from 'styled-components';

export const Bar = styled.footer`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 0 16px;
  background: ${({ theme }) => theme.app.bg.raised};
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
  flex: none;
`;

export const Whisper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const WhisperDot = styled.span`
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: ${({ theme }) => theme.app.status.info.fg};
`;
