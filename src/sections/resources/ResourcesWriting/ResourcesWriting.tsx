import { motion } from 'framer-motion';
import { getTechnicalWriting } from '@lib/data/resources';
import { Wrapper, Inner, Title, Message } from './ResourcesWriting.styles';
const data = getTechnicalWriting();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ResourcesWriting() {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.1 }}>
        <motion.div variants={fadeUp}><Title>Technical Writing</Title></motion.div>
        <motion.div variants={fadeUp}>
          {data.items.length > 0 ? <p>Writing items here.</p> : <Message>{data.earlyStageMessage}</Message>}
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
