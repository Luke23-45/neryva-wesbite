import styled from 'styled-components';

export const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 18px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SidebarSection = styled.div`
  margin-bottom: 8px;
`;

export const SidebarLabel = styled.div`
  padding: 6px 12px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const SidebarItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  background: ${({ $active, theme }) => ($active ? theme.app.surface.active : 'transparent')};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ $active, theme }) => ($active ? theme.app.text.primary : theme.app.text.secondary)};
  cursor: pointer;
  text-align: left;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }

  span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const MethodBadge = styled.span<{ $method: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 9.5px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.04em;
  background: ${({ $method, theme }) =>
    $method === 'GET'
      ? theme.app.status.success.bg
      : $method === 'POST'
        ? theme.app.status.info.bg
        : $method === 'PATCH'
          ? theme.app.status.warning.bg
          : theme.app.status.error.bg};
  color: ${({ $method, theme }) =>
    $method === 'GET'
      ? theme.app.status.success.fg
      : $method === 'POST'
        ? theme.app.status.info.fg
        : $method === 'PATCH'
          ? theme.app.status.warning.fg
          : theme.app.status.error.fg};
  flex-shrink: 0;
  min-width: 38px;
  text-align: center;
`;

export const Detail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
`;

export const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const DetailPath = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.title};
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.005em;
  flex: 1;
  min-width: 0;
  word-break: break-all;
`;

export const Description = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
`;

export const SubsectionLabel = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const ParamsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
`;

export const ParamRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 10px 12px;
  border-radius: 9px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

export const ParamLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const ParamName = styled.span<{ $required: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};

  &::before {
    content: '${({ $required }) => ($required ? '●' : '○')}';
    color: ${({ $required, theme }) =>
      $required ? theme.app.status.warning.fg : theme.app.text.faint};
    margin-right: 6px;
  }
`;

export const ParamDesc = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

export const ParamType = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  padding: 3px 7px;
  border-radius: 5px;
  background: ${({ theme }) => theme.app.status.lilac.bg};
  border: 1px solid ${({ theme }) => theme.app.status.lilac.border};
  color: ${({ theme }) => theme.app.status.lilac.fg};
  letter-spacing: 0.02em;
  white-space: nowrap;
  align-self: center;
`;

export const CodeBlock = styled.pre`
  margin: 0;
  padding: 16px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid ${({ theme }) => theme.app.border.default};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  overflow-x: auto;
  line-height: 1.6;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.app.scrollbar};
    border-radius: 4px;
  }
`;

export const CodeRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
`;

export const LineNumber = styled.span`
  flex-shrink: 0;
  width: 24px;
  text-align: right;
  color: ${({ theme }) => theme.app.text.ghost};
  user-select: none;
`;

export const LineContent = styled.code`
  flex: 1;
  white-space: pre;
`;

export const ExampleBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0 12px;
  flex-wrap: wrap;

  /* A trailing action (e.g. Copy) pushes to the right edge. */
  & > button {
    margin-left: auto;
  }
`;

export const TryBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.app.border.default};

  ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const TryNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const TryNoteStrong = styled.span`
  color: ${({ theme }) => theme.app.text.secondary};
`;
