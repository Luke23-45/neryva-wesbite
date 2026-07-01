import styled from 'styled-components';

export const BorderTop = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;
export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.ink};
  margin-bottom: ${({ theme }) => theme.spacing.s5};
  ${({ theme }) => theme.media.mobile} { font-size: ${({ theme }) => theme.typography.sizesMobile.h2}; }
`;
export const Message = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.muted};
  font-style: italic;
`;
