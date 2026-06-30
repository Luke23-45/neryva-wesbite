import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: ${({ theme }) => theme.spacing.s10} 0 ${({ theme }) => theme.spacing.s8};
  background: ${({ theme }) => theme.colors.paper};
`;
export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
`;
export const Number = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.label};
  color: ${({ theme }) => theme.colors.muted};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.label};
  margin-bottom: ${({ theme }) => theme.spacing.s3};
  display: block;
`;
export const Title = styled.h1`
  font-size: clamp(36px, 5vw, 56px);
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: 1.08;
  color: ${({ theme }) => theme.colors.ink};
  max-width: 700px;
  margin-bottom: ${({ theme }) => theme.spacing.s5};
  letter-spacing: -0.02em;
`;
export const Summary = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  line-height: ${({ theme }) => theme.typography.lineHeights.bodyLg};
  color: ${({ theme }) => theme.colors.inkSoft};
  max-width: 560px;
  ${({ theme }) => theme.media.mobile} { font-size: ${({ theme }) => theme.typography.sizesMobile.bodyLg}; }
`;
