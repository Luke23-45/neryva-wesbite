import styled from 'styled-components';

export const EndpointCard = styled.div`
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
`;

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

export const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const EventChip = styled.button<{ $on: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1px solid
    ${({ $on, theme }) => ($on ? theme.app.status.success.border : theme.app.border.default)};
  background: ${({ $on, theme }) => ($on ? theme.app.status.success.bg : theme.app.surface.subtle)};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

export const EventLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const EventDot = styled.span<{ $on: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $on, theme }) => ($on ? theme.app.status.success.fg : theme.app.text.ghost)};
  box-shadow: 0 0 0 3px ${({ $on, theme }) => ($on ? theme.app.status.success.bg : 'transparent')};
`;

export const EventLabel = styled.code`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const EventMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  padding-left: 18px;
`;
