import styled from 'styled-components';
import { motion } from 'framer-motion';

export const BorderTop = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: 16px;

  ${({ theme }) => theme.media.tablet} {
    padding-top: 12px;
  }
`;

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

export const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 16px;
`;

export const ListItem = styled(motion.div)`
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
  padding: 32px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-color: transparent;
  border-radius: 8px;
  transition: background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), 
              border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: default;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
    border-bottom-color: transparent;
    box-shadow: 
      0 4px 20px rgba(0, 0, 0, 0.03),
      0 0 0 1px ${({ theme }) => theme.colors.border};
    transform: translateY(-2px);
  }

  ${({ theme }) => theme.media.tablet} {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 24px 16px;
    
    &:hover {
      transform: none;
    }
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 20px 12px;
  }
`;

export const TeamName = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
`;

export const TeamFocus = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  max-width: 640px;
`;
