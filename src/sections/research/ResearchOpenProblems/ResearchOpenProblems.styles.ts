import styled from 'styled-components';

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.s7};
  ${({ theme }) => theme.media.mobile} { font-size: ${({ theme }) => theme.typography.sizesMobile.h2}; }
`;
export const ProblemItem = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.s5} 0;
  display: flex;
  gap: ${({ theme }) => theme.spacing.s4};
  align-items: flex-start;
`;
export const ProblemNumber = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.label};
  color: ${({ theme }) => theme.colors.accent.emeraldText};
  min-width: 24px;
  margin-top: 4px;
`;
export const ProblemText = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.text.muted};
  max-width: ${({ theme }) => theme.containers.prose};
`;
