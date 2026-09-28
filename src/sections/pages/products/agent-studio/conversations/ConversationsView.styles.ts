import styled from 'styled-components';

export const Layout = styled.div`
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 18px;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ListPane = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  padding: 14px;
  min-height: 480px;
`;

export const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

export const FilterSelect = styled.select`
  appearance: none;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 8px;
  padding: 6px 10px;
  color: ${({ theme }) => theme.app.text.secondary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0 -6px;
  padding: 0 6px;
  overflow-y: auto;
  max-height: 640px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.app.scrollbar};
    border-radius: 4px;
  }
`;

export const Row = styled.button<{ $active: boolean }>`
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.app.border.strong : 'transparent')};
  background: ${({ $active, theme }) => ($active ? theme.app.surface.tint : 'transparent')};
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.tint};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

export const RowMain = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
  flex: 1;
`;

export const RowTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const RowUser = styled.strong`
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RowTime = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.ghost};
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`;

export const RowPreview = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const RowMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
  flex-wrap: wrap;
`;

export const RowAgent = styled.span`
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const RowChannel = styled.span`
  color: ${({ theme }) => theme.app.text.faint};
`;

export const Rating = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const DetailPane = styled.div``;

export const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
`;

export const DetailMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  flex-wrap: wrap;
`;

export const DetailTitle = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
`;

export const DetailTitleAgent = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-weight: 400;
`;

export const DetailClose = styled.button`
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  border-radius: 6px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const Transcript = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 22px 22px;
`;

export const Bubble = styled.div<{ $role: 'user' | 'agent' }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 88%;
  padding: 12px 14px;
  border-radius: 14px;
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-start' : 'flex-end')};
  background: ${({ $role, theme }) =>
    $role === 'user'
      ? theme.app.surface.tint
      : 'linear-gradient(180deg, rgba(192, 132, 252, 0.10), rgba(37, 99, 235, 0.06))'};
  border: 1px solid
    ${({ $role, theme }) => ($role === 'user' ? theme.app.border.strong : 'rgba(192, 132, 252, 0.18)')};
`;

export const BubbleMeta = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const BubbleText = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.primary};
  overflow-wrap: break-word;
`;
