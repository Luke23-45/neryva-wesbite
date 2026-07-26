import styled from 'styled-components';
import { motion } from 'framer-motion';

export const DeploymentUseCasesSection = styled.section`
  padding: 120px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    padding: 80px 0;
  }
`;

export const DeploymentUseCasesInnerContainer = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.containers.wide};
  margin: 0 auto;
  padding: 0 40px;

  ${({ theme }) => theme.media.mobile} {
    padding: 0 24px;
  }
`;

export const DeploymentUseCasesHeaderBlock = styled.div`
  max-width: 600px;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
`;

export const DeploymentUseCasesTitle = styled.h2`
  font-size: 56px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.primary};

  ${({ theme }) => theme.media.mobile} {
    font-size: 32px;
  }
`;

export const DeploymentUseCasesIconBox = styled.div<{ $colorType?: 'azure' | 'emerald' | 'lilac' | 'amethyst' }>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: auto;

  color: ${({ theme, $colorType }) =>
    $colorType ? theme.colors.accent[`${$colorType}Text`] : theme.colors.text.primary};

  svg {
    width: 48px;
    height: 48px;
    stroke-width: 1.5px;
  }
`;

export const DeploymentUseCasesBentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 280px;

  background-color: ${({ theme }) => theme.colors.border};
  gap: 1px;
  border: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(200px, auto);
  }
`;

export const DeploymentUseCasesBentoCell = styled.div<{ $layoutArea: string; $isActive: boolean }>`
  background-color: ${({ $isActive }) => ($isActive ? '#FFFFFF' : '#f5f4ef')};
  display: flex;
  flex-direction: column;
  position: relative;

  grid-area: ${({ $layoutArea }) => $layoutArea};

  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.06);
    z-index: 1;
  }

  ${({ theme }) => theme.media.tablet} {
    grid-area: auto;
  }
`;

export const DeploymentUseCasesCellInner = styled.div`
  padding: 40px;
  display: flex;
  flex-direction: column;
  flex: 1;

  ${({ theme }) => theme.media.tablet} {
    padding: 32px;
  }
`;

export const DeploymentUseCasesProgressBarTrack = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

export const DeploymentUseCasesProgressBarFill = styled(motion.div)`
  height: 100%;
  width: 100%;
  background: linear-gradient(
    90deg,
    #06B6D4 0%,
    #2563EB 50%,
    #7C3AED 100%
  );
  transform-origin: left center;
`;

export const DeploymentUseCasesAppTitle = styled.h3`
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 24px 0 12px 0;
`;

export const DeploymentUseCasesAppDesc = styled.p`
  font-size: 15px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  max-width: 90%;
`;
