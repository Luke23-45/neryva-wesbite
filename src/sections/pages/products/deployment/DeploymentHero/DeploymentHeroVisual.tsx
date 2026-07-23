import { motion } from 'framer-motion';
import styled from 'styled-components';

import heroVisual from '@assets/page/product/deployment/deployment_hero.png';

const DeploymentHeroVisualContainer = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const DeploymentHeroVisualImage = styled(motion.img)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 2;
`;

const spring = [0.16, 1, 0.3, 1] as const;

export function DeploymentHeroVisual() {
  return (
    <DeploymentHeroVisualContainer>
      <DeploymentHeroVisualImage
        src={heroVisual}
        alt="Neryva AI Deployment Operations"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: spring }}
      />
    </DeploymentHeroVisualContainer>
  );
}
