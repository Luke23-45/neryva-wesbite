import styled from 'styled-components';
import { motion } from 'framer-motion';

export const SectionHeader = styled.div`
  margin-bottom: 64px;

  ${({ theme }) => theme.media.tablet} {
    margin-bottom: 48px;
  }
`;

export const Label = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 16px;

  ${({ theme }) => theme.media.mobile} {
    font-size: 11px;
  }
`;

export const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
  max-width: 800px;
`;

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

export const MissionCard = styled(motion.div)`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 32px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const MissionTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 1rem;
  }
`;

export const MissionDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 0.85rem;
  }
`;
