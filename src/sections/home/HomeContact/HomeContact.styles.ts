import styled from 'styled-components';

export const CenterContent = styled.div`
  text-align: center;
`;

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.s4};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.h2};
  }
`;

export const Body = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  line-height: ${({ theme }) => theme.typography.lineHeights.bodyLg};
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: ${({ theme }) => theme.spacing.s6};
`;

export const Email = styled.a`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  color: ${({ theme }) => theme.colors.accent.emeraldText};
  border: 1px solid transparent;
  padding: 4px 0;
  text-decoration: none;
  
  &:hover {
    color: ${({ theme }) => theme.colors.accent.emerald};
  }
`;
