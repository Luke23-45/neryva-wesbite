import styled from 'styled-components';

export const CapabilitiesSection = styled.section`
  padding: ${({ theme }) => theme.spacing.s10} 0;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  position: relative;
  overflow: hidden;
`;

export const HeaderWrapper = styled.div`
  text-align: center;
  max-width: ${({ theme }) => theme.containers.prose};
  margin: 0 auto ${({ theme }) => theme.spacing.s10};
`;

export const Subtext = styled.span`
  display: inline-block;
  color: ${({ theme }) => theme.colors.accent.emeraldDark};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: ${({ theme }) => theme.spacing.s5};
`;

export const SectionHeading = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h1};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.strong};
  margin-bottom: ${({ theme }) => theme.spacing.s5};
  letter-spacing: -0.02em;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: ${({ theme }) => theme.typography.sizes.h2};
  }
`;

export const SectionDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
`;

export const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.s6};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

export const BentoCard = styled.div<{ $highlight?: boolean }>`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme, $highlight }) => ($highlight ? theme.spacing.s10 : theme.spacing.s8)};
  display: flex;
  flex-direction: column;
  transition: ${({ theme }) => theme.transitions.standard};
  position: relative;
  overflow: hidden;

  grid-column: ${({ $highlight }) => ($highlight ? 'span 2' : 'span 1')};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-column: span 1;
    padding: ${({ theme }) => theme.spacing.s8};
  }

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.borderLight};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s5};
  margin-bottom: ${({ theme }) => theme.spacing.s5};
`;

export const IconContainer = styled.div<{ $colorType?: 'emerald' | 'azure' | 'lilac' | 'amethyst' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.lg};
  
  background-color: ${({ theme, $colorType }) => {
    switch ($colorType) {
      case 'emerald': return theme.colors.accent.emeraldMuted;
      case 'azure': return theme.colors.accent.azureMuted;
      case 'lilac': return theme.colors.accent.lilacMuted;
      case 'amethyst': return theme.colors.accent.amethystMuted;
      default: return theme.colors.background.tertiary;
    }
  }};
  
  color: ${({ theme, $colorType }) => {
    switch ($colorType) {
      case 'emerald': return theme.colors.accent.emeraldDark;
      case 'azure': return theme.colors.accent.azureDark;
      case 'lilac': return theme.colors.accent.lilacDark;
      case 'amethyst': return theme.colors.accent.amethystDark;
      default: return theme.colors.text.strong;
    }
  }};
`;

export const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.strong};
`;

export const CardBody = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  max-width: 90%;
`;
