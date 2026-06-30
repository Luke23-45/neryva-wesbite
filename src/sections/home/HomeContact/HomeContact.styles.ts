import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: ${({ theme }) => theme.spacing.s10} 0;
  background: ${({ theme }) => theme.colors.graphite};

  ${({ theme }) => theme.media.mobile} {
    padding: ${({ theme }) => theme.spacing.s8} 0;
  }
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.prose};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  text-align: center;
`;

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.dark.text};
  margin-bottom: ${({ theme }) => theme.spacing.s4};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.h2};
  }
`;

export const Body = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  line-height: ${({ theme }) => theme.typography.lineHeights.bodyLg};
  color: ${({ theme }) => theme.colors.dark.muted};
  margin-bottom: ${({ theme }) => theme.spacing.s6};
`;

export const Email = styled.a`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  color: ${({ theme }) => theme.colors.dark.accent};
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.dark.accent};
    color: ${({ theme }) => theme.colors.dark.accent};
  }
`;
