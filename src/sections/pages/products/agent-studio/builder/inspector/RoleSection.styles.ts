import styled from 'styled-components';

/** Tag-list editor (Role node): chips with remove buttons + an inline adder. */
export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

export const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 4px 6px 4px 10px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.4;
`;

export const TagText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TagRemove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: 13px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const TagAddRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
`;

export const TagCount = styled.span`
  margin-left: auto;
  flex-shrink: 0;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: ${({ theme }) => theme.app.type.caption};
`;
