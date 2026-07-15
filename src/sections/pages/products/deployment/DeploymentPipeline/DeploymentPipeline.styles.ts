import styled from 'styled-components';

export const FlexContainer = styled.div`
  display: flex;
  align-items: flex-start;
  /* Generous spacing between the sticky sidebar and the main content pipeline */
  gap: 64px;

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    gap: 32px;
  }
`;

export const Sidebar = styled.nav`
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 120px; /* Ample space below the header */
  display: flex;
  flex-direction: column;
  /* Subtle bounding box reflecting the reference image */
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.background.primary};
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    width: 100%;
    position: static;
    flex-direction: row;
    overflow-x: auto;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

export const SidebarItem = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  width: 100%;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  cursor: pointer;
  
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  text-align: left;
  
  /* Active state typography adjustments */
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.weights.medium : theme.typography.weights.regular};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.primary : theme.colors.text.secondary};
  
  transition: all ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: rgba(0, 0, 0, 0.02);
  }

  /* Pixel-perfect recreation of the active right-arrow from the screenshot */
  ${({ $active }) => $active && `
    &::after {
      content: '➔';
      font-size: 14px;
      color: inherit;
      margin-left: 12px;
    }
  `}

  ${({ theme }) => theme.media.tablet} {
    white-space: nowrap;
    border-bottom: none;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    flex-shrink: 0;

    &::after {
      display: none;
    }
    
    &:last-child {
      border-right: none;
    }
  }
`;

export const Panel = styled.div`
  flex: 1;
  min-width: 0;
  /* The master grid wrapper: creates the large, continuous outer box seen in the design */
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.background.primary};
  overflow: hidden;
`;

export const PipelineSectionStyled = styled.section`
  scroll-margin-top: 120px;
  display: flex;
  flex-direction: column;
  /* Strict horizontal divider between major pipeline stages */
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 28px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0;
  /* Deep padding to match the airy, premium feel */
  padding: 24px 32px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background.primary};

  ${({ theme }) => theme.media.mobile} {
    font-size: 22px;
    padding: 20px 24px;
  }
`;

export const VisualBlock = styled.div`
  width: 100%;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  
  /* Architect/Blueprint Canvas Background replicating the screenshot */
  background-color: #F8F9FA;
  background-image: 
    linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  position: relative;

  ${({ theme }) => theme.media.mobile} {
    min-height: 280px;
    background-size: 30px 30px;
  }
`;

export const VisualTypeLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 6px 12px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  z-index: 1;
`;

export const VisualDescription = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  max-width: 480px;
  margin: 0;
  padding: 0 24px;
  z-index: 1;
`;

export const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* CRITICAL: Gap is 0 to allow perfect grid-line borders */
  gap: 0;
  background: ${({ theme }) => theme.colors.background.primary};

  /* 
   * TARGETING THE FRAMER MOTION WRAPPER
   * Since React wraps FeatureCard in a <motion.div>, we apply the strict 
   * vertical borders to the motion div to ensure the lines span 100% height.
   */
  > div {
    display: flex;
    flex-direction: column;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }

  > div:last-child {
    border-right: none;
  }

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    
    > div {
      border-right: none;
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }
    
    > div:last-child {
      border-bottom: none;
    }
  }
`;

export const FeatureCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 32px;
  flex: 1; /* Stretches card to fill varying text heights perfectly */
  background: transparent;
  
  /* All standalone borders & radiuses removed—handled entirely by the grid geometry */
`;

export const FeatureTitle = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.4;
  letter-spacing: -0.01em;
  margin: 0 0 12px 0;
`;

export const FeatureDescription = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

/* Hidden because the strict layout architecture replaces the need for loose spacers */
export const SectionDivider = styled.div`
  display: none; 
`;
