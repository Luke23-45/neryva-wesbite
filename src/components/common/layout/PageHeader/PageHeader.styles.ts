import styled from 'styled-components';

export const StyledPageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.s8};
`;

export const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.sizes.h1};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: ${({ theme }) => theme.typography.lineHeights.heading};
  color: ${({ theme }) => theme.colors.ink};
  margin-bottom: ${({ theme }) => theme.spacing.s4};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.h1};
  }
`;

export const PageDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  line-height: ${({ theme }) => theme.typography.lineHeights.bodyLg};
  color: ${({ theme }) => theme.colors.inkSoft};
  max-width: ${({ theme }) => theme.containers.prose};
  margin-bottom: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.bodyLg};
  }
`;
