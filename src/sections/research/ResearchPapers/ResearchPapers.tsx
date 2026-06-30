import { motion } from 'framer-motion';
import { getPapers } from '@lib/data/research';
import { Wrapper, Inner, Title, Message } from './ResearchPapers.styles';

const papers = getPapers();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ResearchPapers() {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.1 }}>
        <motion.div variants={fadeUp}><Title>Papers and Preprints</Title></motion.div>
        <motion.div variants={fadeUp}>
          {papers.items.length > 0 ? <p>Papers list here.</p> : <Message>{papers.earlyStageMessage}</Message>}
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
