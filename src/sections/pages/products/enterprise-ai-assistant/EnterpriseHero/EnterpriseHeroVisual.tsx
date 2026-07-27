import { motion } from 'framer-motion';
import styled from 'styled-components';

import interfaceImage from '@assets/page/product/enterprised_ai/enterprise_interface.png';

const VisualContainer = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const ImageInterface = styled(motion.img)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 2;
`;

const spring = [0.16, 1, 0.3, 1] as const;

export function EnterpriseHeroVisual() {
  return (
    <VisualContainer>
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

