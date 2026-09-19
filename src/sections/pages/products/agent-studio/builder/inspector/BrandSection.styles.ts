import styled from 'styled-components';

export const GuideBox = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 12px;
  padding: 4px 12px 12px;
`;

export const GuideToggle = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  padding: 8px 0 4px;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const GuideBody = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.65;
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    color: ${({ theme }) => theme.app.text.primary};
    font-weight: 600;
  }
`;

export const DefaultNote = styled.div`
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 12px;
  padding: 12px 14px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
`;
