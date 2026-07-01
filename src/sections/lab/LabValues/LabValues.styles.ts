import styled from 'styled-components';
export const Wrapper = styled.section`
  padding: ${({ theme }) => theme.spacing.s10} 0;
  background: ${({ theme }) => theme.colors.graphite};
`;
export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
`;
export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.s7};
  ${({ theme }) => theme.media.mobile} { font-size: ${({ theme }) => theme.typography.sizesMobile.h2}; }
`;
export const ValueItem = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.s5} 0;
  display: flex;
  gap: ${({ theme }) => theme.spacing.s4};
  align-items: flex-start;
`;
export const ValueNumber = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.label};
  color: ${({ theme }) => theme.colors.accent.tealText};
  min-width: 24px;
  margin-top: 4px;
`;
export const ValueText = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.text.muted};
  max-width: ${({ theme }) => theme.containers.prose};
`;
