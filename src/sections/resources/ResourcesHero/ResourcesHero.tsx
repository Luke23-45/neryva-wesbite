import { motion } from 'framer-motion';
import { Wrapper, Inner, Eyebrow, Title, Description } from './ResourcesHero.styles';
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ResourcesHero() {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }}>
        <motion.div variants={fadeUp}><Eyebrow>Resources</Eyebrow></motion.div>
        <motion.div variants={fadeUp}><Title>Technical writing, open source, and reading lists.</Title></motion.div>
        <motion.div variants={fadeUp}>
          <Description>Public outputs from our research â€” writing, code, and curated references we use and recommend.</Description>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
