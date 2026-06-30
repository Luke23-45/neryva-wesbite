import styled from 'styled-components';

export const HeroWrapper = styled.section`
  position: relative;
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.graphite};
  padding: ${({ theme }) => theme.spacing.s10} 0;

  ${({ theme }) => theme.media.mobile} {
    min-height: calc(100vh - 60px);
    padding: ${({ theme }) => theme.spacing.s8} 0;
  }
`;

export const HeroContainer = styled.div`
  position: relative;
  z-index: 2;
  max-width: ${({ theme }) => theme.containers.page};
  width: 100%;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    padding: 0 ${({ theme }) => theme.spacing.s4};
  }
`;

export const HeroLabel = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.label};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.label};
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.dark.muted};
  margin-bottom: ${({ theme }) => theme.spacing.s5};
  padding: ${({ theme }) => `${theme.spacing.s1} ${theme.spacing.s3}`};
  border: 1px solid ${({ theme }) => theme.colors.dark.line};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

export const HeroTitle = styled.h1`
  font-size: clamp(42px, 7vw, 80px);
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: 1.02;
  color: ${({ theme }) => theme.colors.dark.text};
  max-width: 900px;
  margin-bottom: ${({ theme }) => theme.spacing.s6};
  letter-spacing: -0.02em;
`;

export const GradientSpan = styled.span`
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.dark.accent} 0%,
    ${({ theme }) => theme.colors.teal} 50%,
    ${({ theme }) => theme.colors.blue} 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const HeroDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  line-height: ${({ theme }) => theme.typography.lineHeights.bodyLg};
  color: ${({ theme }) => theme.colors.dark.muted};
  max-width: 560px;
  margin-bottom: ${({ theme }) => theme.spacing.s7};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.bodyLg};
  }
`;

export const HeroActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s4};
  flex-wrap: wrap;
`;

export const HeroPrimaryLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => `${theme.spacing.s3} ${theme.spacing.s5}`};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.graphite};
  background: ${({ theme }) => theme.colors.dark.text};
  border-radius: ${({ theme }) => theme.radii.sm};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.ink};
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
`;

export const HeroSecondaryLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.dark.muted};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.dark.text};
  }
`;

export const HeroGrid = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.04;
  background-image:
    linear-gradient(rgba(247, 245, 239, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(247, 245, 239, 0.3) 1px, transparent 1px);
  background-size: 80px 80px;
`;

export const HeroGlow = styled.div`
  position: absolute;
  top: -200px;
  right: -100px;
  width: 600px;
  height: 600px;
  z-index: 1;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(36, 88, 211, 0.15) 0%,
    rgba(11, 127, 121, 0.08) 40%,
    transparent 70%
  );
  filter: blur(80px);
  pointer-events: none;
`;
