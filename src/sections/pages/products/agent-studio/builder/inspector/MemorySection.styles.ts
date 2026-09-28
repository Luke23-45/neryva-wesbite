import styled from 'styled-components';

/** Read-only in-scope preview rows. */
export const PreviewList = styled.ul`
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const PreviewItem = styled.li`
  border-radius: 9px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 8px 10px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.5;
`;

export const PreviewMeta = styled.div`
  color: ${({ theme }) => theme.app.text.ghost};
  font-size: 11px;
  margin-top: 2px;
`;
