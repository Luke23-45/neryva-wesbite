import { motion } from 'framer-motion';
import { Wrapper, Inner, Eyebrow, Title, Description } from './ResearchHero.styles';

const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } },
};

export function ResearchHero() {
  return (
    <Wrapper>
      <Inner
        as={motion.div}
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.div variants={fadeUp}><Eyebrow>Research</Eyebrow></motion.div>
        <motion.div variants={fadeUp}>
          <Title>Our research agenda and active technical areas.</Title>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Description>
            We study routing, sparsity, training stability, and inference optimization â€” the mechanisms through which efficiency, stability, and deployability are achieved.
          </Description>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
