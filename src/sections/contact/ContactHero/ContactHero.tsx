import { motion } from 'framer-motion';
import { Wrapper, Inner, Eyebrow, Title, Description } from './ContactHero.styles';
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };
export function ContactHero() {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }}>
        <motion.div variants={fadeUp}><Eyebrow>Contact</Eyebrow></motion.div>
        <motion.div variants={fadeUp}><Title>We read every message carefully.</Title></motion.div>
        <motion.div variants={fadeUp}>
          <Description>We are a small lab. Reach out for research collaboration, technical questions, or general inquiries.</Description>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
