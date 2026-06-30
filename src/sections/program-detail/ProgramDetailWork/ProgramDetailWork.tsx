import { motion } from 'framer-motion';
import type { ProgramDetail } from '@types';
import { Wrapper, Inner, Title, Body } from './ProgramDetailWork.styles';

const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ProgramDetailWork({ program }: { program: ProgramDetail }) {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.1 }}>
        <motion.div variants={fadeUp}><Title>Current Work</Title></motion.div>
        <motion.div variants={fadeUp}><Body>{program.currentWork}</Body></motion.div>
      </Inner>
    </Wrapper>
  );
}
