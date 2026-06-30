import { motion } from 'framer-motion';
import type { ProgramDetail } from '@types';
import { Wrapper, Inner, Number, Title, Summary } from './ProgramDetailHero.styles';

const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ProgramDetailHero({ program }: { program: ProgramDetail }) {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }}>
        <motion.div variants={fadeUp}><Number>Program {program.number}</Number></motion.div>
        <motion.div variants={fadeUp}><Title>{program.title}</Title></motion.div>
        <motion.div variants={fadeUp}><Summary>{program.summary}</Summary></motion.div>
      </Inner>
    </Wrapper>
  );
}
