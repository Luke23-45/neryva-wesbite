import styled from 'styled-components';

export const BorderTop = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.ink};
  margin-bottom: ${({ theme }) => theme.spacing.s6};
  ${({ theme }) => theme.media.mobile} { font-size: ${({ theme }) => theme.typography.sizesMobile.h2}; }
`;
export const Paragraph = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.inkSoft};
  margin-bottom: ${({ theme }) => theme.spacing.s5};
  &:last-of-type { margin-bottom: 0; }
`;
