import styled from 'styled-components';

export const HeroWrapper = styled.section`
  display: flex;
  min-height: calc(100vh - 80px);
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    min-height: auto;
  }
`;

export const ContentColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 120px 80px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.desktop} {
    padding: 100px 60px;
  }

  ${({ theme }) => theme.media.tablet} {
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    padding: 80px 40px;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 60px 24px;
  }
`;

export const VisualColumn = styled.div`
  flex: 1;
  position: relative;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  /* Blueprint canvas effect */
  background-image: 
    linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 40px 40px;

  ${({ theme }) => theme.media.tablet} {
    min-height: 400px;
  }
`;

export const Eyebrow = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.s4};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};

  &::before {
    content: '';
    display: inline-block;
    width: 24px;
    height: 1px;
    background-color: ${({ theme }) => theme.colors.text.muted};
  }
`;

export const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(3rem, 6vw, 5.5rem);
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: -0.04em;
  line-height: 1.05;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 ${({ theme }) => theme.spacing.s6} 0;
  max-width: 800px;
`;

export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 0 ${({ theme }) => theme.spacing.s8} 0;
`;

export const ScrollIndicator = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.7;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;
