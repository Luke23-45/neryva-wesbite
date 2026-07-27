import styled from 'styled-components';

export const TypesSection = styled.section`
  padding: ${({ theme }) => theme.spacing.s10} 0;
  /* Dark slate background for infrastructure contrast */
  background-color: ${({ theme }) => theme.colors.text.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  position: relative;
  overflow: hidden;

  /* Subtle dark mesh or radial gradient for depth */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 100% 100%, rgba(5, 227, 164, 0.05) 0%, transparent 40%);
    pointer-events: none;
  }
`;

export const HeaderWrapper = styled.div`
  text-align: center;
  max-width: 800px;
  margin: 0 auto ${({ theme }) => theme.spacing.s10};
  position: relative;
  z-index: 1;
`;

export const Subtitle = styled.span`
  display: inline-block;
  color: ${({ theme }) => theme.colors.accent.azureLight};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.small};
  }
`;

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h1};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.inverse};
  margin-bottom: ${({ theme }) => theme.spacing.s5};
  letter-spacing: -0.02em;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: ${({ theme }) => theme.typography.sizes.h2};
  }
`;

export const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  /* Using slate-400 equivalent for softer dark mode text */
  color: #94A3B8; 
  line-height: ${({ theme }) => theme.typography.lineHeights.body};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.bodyLg};
  }
`;

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.s6};
  position: relative;
  z-index: 1;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

export const TypeCard = styled.div`
  /* Dark surface card */
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.s8};
  display: flex;
  flex-direction: column;
  transition: ${({ theme }) => theme.transitions.standard};
  backdrop-filter: blur(10px);

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
`;

export const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: rgba(255, 255, 255, 0.05);
  color: ${({ theme }) => theme.colors.accent.azureLight};
  margin-bottom: ${({ theme }) => theme.spacing.s6};
`;

export const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.inverse};
  margin-bottom: ${({ theme }) => theme.spacing.s3};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.h3};
  }
`;

export const CardDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: #94A3B8;
  line-height: ${({ theme }) => theme.typography.lineHeights.body};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.body};
  }
`;
