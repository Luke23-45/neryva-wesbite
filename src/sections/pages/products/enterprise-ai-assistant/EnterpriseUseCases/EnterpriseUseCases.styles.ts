import styled from 'styled-components';

export const UseCasesSection = styled.section`
  padding: ${({ theme }) => theme.spacing.s10} 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  overflow: hidden;
`;

export const HeaderContainer = styled.div`
  text-align: center;
  max-width: 800px;
  margin: 0 auto ${({ theme }) => theme.spacing.s8};
`;

export const Subtitle = styled.span`
  display: inline-block;
  color: ${({ theme }) => theme.colors.accent.azure};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: ${({ theme }) => theme.spacing.s5};
`;

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h1};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.strong};
  margin-bottom: ${({ theme }) => theme.spacing.s5};
  letter-spacing: -0.02em;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: ${({ theme }) => theme.typography.sizes.h2};
  }
`;

export const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
`;

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.s8};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.s6};
  }
`;

export const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.s8};
  transition: ${({ theme }) => theme.transitions.standard};
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  /* Subtle gradient background for premium feel */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ theme }) => theme.colors.gradients.primary};
    opacity: 0;
    transition: ${({ theme }) => theme.transitions.standard};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.borderLight};

    &::before {
      opacity: 1;
    }
  }
`;

export const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background.tertiary};
  color: ${({ theme }) => theme.colors.accent.azure};
  margin-bottom: ${({ theme }) => theme.spacing.s6};
  
  transition: ${({ theme }) => theme.transitions.default};

  ${Card}:hover & {
    background-color: ${({ theme }) => theme.colors.accent.azureMuted};
    color: ${({ theme }) => theme.colors.accent.azureDark};
  }
`;

export const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.strong};
  margin-bottom: ${({ theme }) => theme.spacing.s3};
`;

export const CardDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
`;
