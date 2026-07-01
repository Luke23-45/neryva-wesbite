import { motion } from 'framer-motion';
import { HeroMosaic } from './HeroMosaic';
import {
  Wrapper,
  ContentLayer,
  Eyebrow,
  Tagline,
  MosaicBlock,
  Divider,
  MissionContainer,
  MissionEyebrow,
  MissionTagline,
  MissionDescription,
  ScrollHint,
  ScrollLine,
} from './ResearchHero.styles';

/* Shared spring curve */
const spring = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: spring, delay },
  }),
};

export function ResearchHero() {
  return (
    <Wrapper>
      {/* ── Eyebrow label ── */}
      <ContentLayer>
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.1}
          variants={fadeUp}
        >
          <Eyebrow>
            <span>Neryva Lab</span>
          </Eyebrow>
        </motion.div>

        {/* ── Main tagline ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.22}
          variants={fadeUp}
        >
          <Tagline>
            Computation,{' '}
            <em>used well.</em>
          </Tagline>
        </motion.div>

        {/* ── Animated geometric mosaic ── */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.0, ease: spring, delay: 0.38 }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <MosaicBlock>
            <HeroMosaic />
          </MosaicBlock>
        </motion.div>

        {/* ── Divider ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.72 }}
        >
          <Divider />
        </motion.div>

        {/* ── Mission block ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.82}
          variants={fadeUp}
        >
          <MissionContainer>
            <MissionEyebrow>Our Mission</MissionEyebrow>
            <MissionTagline>
              The next leap will come from how we compute, not how much.
            </MissionTagline>
            <MissionDescription>
              Neryva studies how large-scale AI systems can use computation more effectively,
              train more stably, and deploy more reliably under real constraints.
              We work on routing, sparsity, training dynamics, and inference — the
              mechanisms that separate brittle scale from genuine capability.
            </MissionDescription>
          </MissionContainer>
        </motion.div>
      </ContentLayer>

      {/* ── Scroll hint ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0, delay: 1.4 }}
        style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}
      >
        <ScrollHint>
          <ScrollLine />
          <span>Scroll</span>
        </ScrollHint>
      </motion.div>
    </Wrapper>
  );
}
