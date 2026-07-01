import styled from 'styled-components';

export const CenterWrap = styled.div`
  min-height: calc(100vh - 72px - 200px);
  display: flex;
  align-items: center;
`;
export const Code = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: clamp(60px, 10vw, 120px);
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.line};
  line-height: 1;
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.s4};
`;
export const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.ink};
  margin-bottom: ${({ theme }) => theme.spacing.s4};
  ${({ theme }) => theme.media.mobile} { font-size: ${({ theme }) => theme.typography.sizesMobile.h2}; }
`;
export const Message = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  color: ${({ theme }) => theme.colors.inkSoft};
  margin-bottom: ${({ theme }) => theme.spacing.s6};
`;
