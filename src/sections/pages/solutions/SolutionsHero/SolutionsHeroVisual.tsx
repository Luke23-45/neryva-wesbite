import { motion } from 'framer-motion';
import styled from 'styled-components';
import heroImage from '@assets/page/solution/hero.png';

const VisualContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeroImg = styled(motion.img)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, rgba(15, 23, 42, 0.4) 0%, transparent 20%);
  pointer-events: none;
`;

export function SolutionsHeroVisual() {
  return (
    <VisualContainer>
      <HeroImg
        src={heroImage}
        alt="Neryva Commercial Enterprise Solutions"
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <Overlay />
    </VisualContainer>
  );
}
