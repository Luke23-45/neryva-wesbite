import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: ${({ theme }) => theme.spacing.s10} 0;
  background: ${({ theme }) => theme.colors.paper};

  ${({ theme }) => theme.media.mobile} {
    padding: ${({ theme }) => theme.spacing.s8} 0;
  }
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    padding: 0 ${({ theme }) => theme.spacing.s4};
  }
`;

export const Eyebrow = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.label};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.label};
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: ${({ theme }) => theme.spacing.s4};
`;

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: ${({ theme }) => theme.typography.lineHeights.h2};
  color: ${({ theme }) => theme.colors.ink};
  max-width: 640px;
  margin-bottom: ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.h2};
  }
`;

export const Body = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  line-height: ${({ theme }) => theme.typography.lineHeights.bodyLg};
  color: ${({ theme }) => theme.colors.inkSoft};
  max-width: ${({ theme }) => theme.containers.prose};
  margin-bottom: ${({ theme }) => theme.spacing.s6};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.bodyLg};
  }
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.s2};
  margin-bottom: ${({ theme }) => theme.spacing.s5};
`;
