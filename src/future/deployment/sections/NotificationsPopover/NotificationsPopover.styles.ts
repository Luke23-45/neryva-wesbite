import styled from 'styled-components';

export const BellDot = styled.span`
  position: absolute;
  top: 6px;
  right: 7px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.app.status.error.fg};
  box-shadow: 0 0 0 2px ${({ theme }) => theme.app.bg.base};
`;

export const NotifButton = styled.button<{ $open: boolean }>`
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${({ theme, $open }) => ($open ? theme.app.text.primary : theme.app.text.muted)};
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.active};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const NotifList = styled.div`
  max-height: 360px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.app.scrollbar};
    border-radius: 4px;
  }
`;

export const NotifRow = styled.div<{ $unread: boolean }>`
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
  background: ${({ $unread, theme }) => ($unread ? theme.app.surface.subtle : 'transparent')};
`;

export const NotifDot = styled.span<{ $tone: 'success' | 'warning' | 'error' | 'info' }>`
  margin-top: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ theme, $tone }) => theme.app.status[$tone].fg};
  box-shadow: 0 0 0 3px ${({ theme, $tone }) => theme.app.status[$tone].bg};
`;

export const NotifBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const NotifTitle = styled.div<{ $unread: boolean }>`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme, $unread }) => ($unread ? theme.app.text.primary : theme.app.text.secondary)};
`;

export const NotifDetail = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
`;

export const NotifTime = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.ghost};
  margin-top: 4px;
`;

export const NotifFooter = styled.div`
  padding: 10px 16px;
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
  text-align: center;
`;
