import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ChevronRight } from 'lucide-react';
import { useUiStore } from '@store/uiStore';

// Assuming HeroMosaic is handled in a separate file as requested
import { HeroMosaic } from './HeroMosaic';

import {
  Wrapper,
  HeaderArea,
  MassiveTitle,
  DividerLine,
  LeftContent,
  ArrowStack,
  HeroDescription,
  CTAButton,
  RightBleed,
  MosaicContainer,
} from './ResearchHero.styles';

// Premium hardware-accelerated easing
const premiumEase = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: premiumEase }
  },
};

export function ResearchHero() {
  const { setHeaderTheme } = useUiStore();

  // The reference design requires a light header for the stark black/white contrast
  useEffect(() => {
    setHeaderTheme('light');
  }, [setHeaderTheme]);

  return (
    <Wrapper>
      {/* ── Top Header Area ── */}
      <HeaderArea
        as={motion.div}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <MassiveTitle>Computation, used well.</MassiveTitle>
      </HeaderArea>

      {/* ── Full-Width Structural Divider ── */}
      <DividerLine
        as={motion.div}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1, ease: premiumEase, delay: 0.1 }}
        style={{ originX: 0 }} // Animates from left to right
      />

      {/* ── Left Editorial Content ── */}
      <LeftContent
        as={motion.div}
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
        }}
      >
        <motion.div variants={fadeUp}>
          <ArrowStack>
            {/* Ultra-thin, refined designer arrows mimicking the reference */}
            <ArrowDown size={16} strokeWidth={1} />
            <ArrowDown size={16} strokeWidth={1} />
            <ArrowDown size={16} strokeWidth={1} />
          </ArrowStack>
        </motion.div>

        <motion.div variants={fadeUp}>
          <HeroDescription>
            Neryva studies how large-scale AI systems can use computation more effectively,
            train more stably, and deploy more reliably under real constraints.
          </HeroDescription>
        </motion.div>

        <motion.div variants={fadeUp}>
          <CTAButton>
            Explore Research <ChevronRight size={16} strokeWidth={2} />
          </CTAButton>
        </motion.div>
      </LeftContent>

      {/* ── Right Bleed Graphic (Dark Theme Area) ── */}
      <RightBleed
        as={motion.div}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: premiumEase, delay: 0.3 }}
      >
        <MosaicContainer
          as={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: premiumEase, delay: 0.4 }}
        >
          {/* The visual container will handle its own animations internally */}
          <HeroMosaic />
        </MosaicContainer>
      </RightBleed>
    </Wrapper>
  );
}