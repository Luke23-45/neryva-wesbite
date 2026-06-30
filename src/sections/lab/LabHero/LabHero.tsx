import { motion } from 'framer-motion';
import { Wrapper, Inner, Eyebrow, Title, Description } from './LabHero.styles';
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };
export function LabHero() {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }}>
        <motion.div variants={fadeUp}><Eyebrow>Lab</Eyebrow></motion.div>
        <motion.div variants={fadeUp}><Title>Who we are, what we believe, and how we work.</Title></motion.div>
        <motion.div variants={fadeUp}>
          <Description>A small, focused AI research lab studying efficiency, stability, and deployability.</Description>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
