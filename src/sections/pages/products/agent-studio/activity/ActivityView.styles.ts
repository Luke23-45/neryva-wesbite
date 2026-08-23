import styled from 'styled-components';

export const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 14px;
`;

export const FilterChip = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active, theme }) => ($active ? 'transparent' : theme.app.border.default)};
  cursor: pointer;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 999px;
  color: ${({ $active, theme }) => ($active ? theme.app.text.inverse : theme.app.text.secondary)};
  background: ${({ $active, theme }) => ($active ? theme.app.text.primary : 'transparent')};
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ $active, theme }) => ($active ? theme.app.text.inverse : theme.app.text.primary)};
    border-color: ${({ $active, theme }) => ($active ? 'transparent' : theme.app.border.hover)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const Group = styled.section`
  & + & {
    margin-top: 18px;
  }
`;

export const GroupTitle = styled.h3`
  margin: 0 0 6px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 11px 10px;
  border-radius: 10px;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.subtle};
  }
`;

export const RowTime = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
  width: 44px;
  flex-shrink: 0;
  padding-top: 2px;
`;

export const RowDot = styled.span<{ $tone: 'success' | 'warning' | 'error' | 'info' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
  background: ${({ theme, $tone }) => theme.app.status[$tone].fg};
  box-shadow: 0 0 0 3px ${({ theme, $tone }) => theme.app.status[$tone].bg};
`;

export const RowMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

export const RowTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const RowDetail = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.45;
`;

export const RowMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 3px;
  flex-wrap: wrap;
`;
