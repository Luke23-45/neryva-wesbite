import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

export const CoreWrapper = styled.section`
  /* No vertical padding, rely on grid lines for visual separation */
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.containers.wide};
  margin: 0 auto;
  /* We will use 0 padding here and handle it per-block to ensure full-bleed borders on mobile if needed */
`;

export const SectionHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.s8} ${({ theme }) => theme.spacing.s5};
  text-align: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-image: 
    linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px);
  background-size: 30px 30px;
`;

export const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 ${({ theme }) => theme.spacing.s3} 0;
`;

export const SectionDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 auto;
  max-width: 600px;
`;

export const OfferGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* Strict 0px gap. Borders will form the grid lines */
  gap: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  > div {
    display: flex;
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

export const OfferCard = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.s8} ${({ theme }) => theme.spacing.s10};
  background: ${({ theme }) => theme.colors.background.primary};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(0, 0, 0, 0.01);
  }

  ${({ theme }) => theme.media.tablet} {
    padding: ${({ theme }) => theme.spacing.s6} ${({ theme }) => theme.spacing.s5};
  }
`;

export const OfferTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.s2} 0;
`;

export const OfferDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing.s6} 0;
`;

export const OutcomesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 ${({ theme }) => theme.spacing.s8} 0;
  flex: 1;
`;

export const OutcomeItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.s3};
  margin-bottom: ${({ theme }) => theme.spacing.s3};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.primary};

  &::before {
    content: '';
    display: inline-block;
    margin-top: 8px;
    width: 6px;
    height: 6px;
    background-color: ${({ theme }) => theme.colors.text.strong};
    flex-shrink: 0;
  }
`;

export const OfferLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.strong};
  text-decoration: none;
  margin-top: auto;
  align-self: flex-start;
  padding-bottom: 4px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.text.strong};
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.7;
  }
`;

export const OutcomesBox = styled.div`
  display: flex;
  
  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
  }
`;

export const OutcomesBoxHeader = styled.div`
  width: 300px;
  padding: ${({ theme }) => theme.spacing.s6} ${({ theme }) => theme.spacing.s5};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  flex-shrink: 0;

  ${({ theme }) => theme.media.tablet} {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

export const OutcomesBoxTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.s2} 0;
`;

export const OutcomesBoxDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  line-height: 1.5;
`;

export const BusinessOutcomesList = styled.ul`
  list-style: none;
  padding: ${({ theme }) => theme.spacing.s6} ${({ theme }) => theme.spacing.s5};
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.s4};
  flex: 1;

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const BusinessOutcomeItem = styled.li`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};

  &::before {
    content: '✓';
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;
