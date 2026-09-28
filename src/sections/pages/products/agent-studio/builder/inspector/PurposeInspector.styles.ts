import styled from 'styled-components';

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const Counter = styled.div`
  margin-top: 4px;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

export const TakenPanel = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TakenTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

export const TakenBody = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.5;
`;

export const DeniedPanel = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 12px;
  padding: 14px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
`;

export const ReadRows = styled.dl`
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ReadRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ReadKey = styled.dt`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 600;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.app.text.muted};
`;

/** Identity header: key on the left, edit affordance pinned top-right. */
export const IdentityHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const EditIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;
  flex: none;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.subtle};
    border-color: ${({ theme }) => theme.app.border.default};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.status.info.fg};
    outline-offset: 2px;
  }
`;

export const ReadValue = styled.dd`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  line-height: 1.55;
  overflow-wrap: anywhere;
`;

export const RowActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

export const GalleryLink = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.55;

  a {
    color: ${({ theme }) => theme.app.status.info.fg};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;
