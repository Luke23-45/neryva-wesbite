import styled from 'styled-components';

export const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 28px 80px;

  ${({ theme }) => theme.media.mobile} {
    padding: 24px 18px 56px;
  }
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;
