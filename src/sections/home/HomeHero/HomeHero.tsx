import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import {
  HeroWrapper,
  HeroContainer,
  HeroLabel,
  HeroTitle,
  GradientSpan,
  HeroDescription,
  HeroActions,
  HeroPrimaryLink,
  HeroSecondaryLink,
  HeroGrid,
  HeroGlow,
} from './HomeHero.styles';

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0, 0, 1] } },
};

export function HomeHero() {
  return (
    <HeroWrapper>
      <HeroGrid />
      <HeroGlow />
      <HeroContainer
        as={motion.div}
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp}>
          <HeroLabel>AI Research Lab</HeroLabel>
        </motion.div>

        <motion.div variants={fadeUp}>
          <HeroTitle>
            Making computation{' '}
            <GradientSpan>more useful</GradientSpan>
            {' '}at every scale.
          </HeroTitle>
        </motion.div>

        <motion.div variants={fadeUp}>
          <HeroDescription>
            Neryva studies how large-scale AI systems can use computation more 
            effectively, train more stably, and deploy more reliably under real 
            constraints.
          </HeroDescription>
        </motion.div>

        <motion.div variants={fadeUp}>
          <HeroActions>
            <HeroPrimaryLink as={Link} to="/research">
              Explore our research
              <ArrowRight size={14} />
            </HeroPrimaryLink>
            <HeroSecondaryLink as={Link} to="/programs">
              View programs â†’
            </HeroSecondaryLink>
          </HeroActions>
        </motion.div>
      </HeroContainer>
    </HeroWrapper>
  );
}
