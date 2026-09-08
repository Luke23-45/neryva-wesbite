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

export const NotifRow = styled.button<{ $unread: boolean }>`
  display: flex;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
  background: ${({ $unread, theme }) => ($unread ? theme.app.surface.subtle : 'transparent')};
  text-align: left;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
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
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const NotifDetail = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
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

// ── Announcements (S-5) ─────────────────────────────────────────────────────

export const AnnouncementRow = styled.div`
  padding: 12px 16px;
  border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
  background: ${({ theme }) => theme.app.surface.subtle};
  display: flex;
  gap: 10px;
`;

export const AnnouncementIcon = styled.span`
  margin-top: 3px;
  color: ${({ theme }) => theme.app.status.info.fg};
  display: inline-flex;
  flex-shrink: 0;
`;

export const AnnouncementBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const AnnouncementLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.ghost};
  margin-bottom: 3px;
`;

export const AnnouncementTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const AnnouncementMessage = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
`;

export const AnnouncementTime = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.ghost};
  margin-top: 4px;
`;

export const DismissButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.ghost};
  cursor: pointer;
  padding: 2px;
  border-radius: 6px;
  flex-shrink: 0;
  align-self: flex-start;
  transition: color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.active};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

// ── Empty / loading / error states ─────────────────────────────────────────

export const EmptyWrap = styled.div`
  padding: 36px 16px;
  text-align: center;
`;

export const EmptyTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const EmptyBody = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.ghost};
  margin-top: 4px;
  line-height: 1.5;
`;

export const StateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const RetryLink = styled.button`
  border: 0;
  background: transparent;
  padding: 0;
  font-size: inherit;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;
