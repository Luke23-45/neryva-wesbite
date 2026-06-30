import { motion } from 'framer-motion';
import type { ProgramDetail } from '@types';
import { Wrapper, Inner, Title, Item, Number, Text } from './ProgramDetailQuestions.styles';

const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ProgramDetailQuestions({ program }: { program: ProgramDetail }) {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.08 }}>
        <motion.div variants={fadeUp}><Title>Key Questions</Title></motion.div>
        {program.keyQuestions.map((q, i) => (
          <motion.div key={q.id} variants={fadeUp}>
            <Item>
              <Number>{String(i + 1).padStart(2, '0')}</Number>
              <Text>{q.question}</Text>
            </Item>
          </motion.div>
        ))}
      </Inner>
    </Wrapper>
  );
}
