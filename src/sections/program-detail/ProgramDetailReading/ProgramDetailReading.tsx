import { motion } from 'framer-motion';
import type { ProgramDetail } from '@types';
import { Wrapper, Inner, Title, ReadingCard, ReadingTitle, ReadingSource, ReadingReason } from './ProgramDetailReading.styles';

const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ProgramDetailReading({ program }: { program: ProgramDetail }) {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.08 }}>
        <motion.div variants={fadeUp}><Title>Related Reading</Title></motion.div>
        {program.relatedReading.map((r, i) => (
          <motion.div key={i} variants={fadeUp}>
            <ReadingCard>
              <div>
                <ReadingTitle>{r.title}</ReadingTitle>
                <ReadingSource>{r.source}</ReadingSource>
              </div>
              <ReadingReason>{r.reason}</ReadingReason>
            </ReadingCard>
          </motion.div>
        ))}
      </Inner>
    </Wrapper>
  );
}
