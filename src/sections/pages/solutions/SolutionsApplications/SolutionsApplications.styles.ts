import styled from 'styled-components';

export const AppsWrapper = styled.section`
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.containers.wide};
  margin: 0 auto;
`;

export const AppsHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.s8} ${({ theme }) => theme.spacing.s5};
  text-align: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const AppsTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 ${({ theme }) => theme.spacing.s3} 0;
`;

export const AppsDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 auto;
  max-width: 600px;
`;

export const AppsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;

  > div {
    display: flex;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  /* Remove right border for even items */
  > div:nth-child(2n) {
    border-right: none;
  }
  
  /* Remove bottom border for the last two items */
  > div:nth-last-child(-n+2) {
    border-bottom: none;
  }

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    
    > div {
      border-right: none;
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }
    
    > div:nth-child(2n) {
      border-right: none;
    }
    
    > div:last-child {
      border-bottom: none;
    }
  }
`;

export const AppCard = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  flex-direction: column;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(0, 0, 0, 0.01);
  }
`;

export const AppCardVisual = styled.div`
  height: 120px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-image: 
    linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.spacing.s6};
`;

export const AppCardNumber = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: 600;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const AppCardContent = styled.div`
  padding: ${({ theme }) => theme.spacing.s6};
`;

export const AppCardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.s2} 0;
`;

export const AppCardDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;
