import { motion } from 'framer-motion';
import styled from 'styled-components';

import coreImage from '@assets/images/page/enterprised_ai/enterprise_core.png';
import interfaceImage from '@assets/images/page/enterprised_ai/enterprise_interface.png';

const VisualContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const ImageCore = styled(motion.img)`
  position: absolute;
  width: 110%;
  height: 110%;
  object-fit: cover;
  opacity: 0.5;
  mix-blend-mode: lighten;
  z-index: 1;
`;

const ImageInterface = styled(motion.img)`
  position: relative;
  width: 80%;
  max-width: 640px;
  border-radius: 8px;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5);
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const spring = [0.16, 1, 0.3, 1] as const;

export function EnterpriseHeroVisual() {
  return (
    <VisualContainer>
      <ImageCore
        src={coreImage}
        alt="AI Core Architecture"
        initial={{ opacity: 0, scale: 1.15 }}
        animate={{ opacity: 0.7, scale: 1 }}
        transition={{ duration: 1.8, ease: spring }}
      />
      <ImageInterface
        src={interfaceImage}
        alt="AI Enterprise Interface"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: spring }}
      />
    </VisualContainer>
  );
}

