import styled from 'styled-components';

export const InviteFacts = styled.dl`
  width: 100%;
  margin: 20px 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const InviteFact = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 14px;
  line-height: 1.5;

  dt {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  dd {
    margin: 0;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    text-align: right;
  }
`;
