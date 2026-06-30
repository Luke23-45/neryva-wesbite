import { motion } from 'framer-motion';
import type { ProgramDetail } from '@types';
import { Wrapper, Inner, Title, Body, FocusList, FocusItem } from './ProgramDetailFocus.styles';

const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ProgramDetailFocus({ program }: { program: ProgramDetail }) {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.08 }}>
        <motion.div variants={fadeUp}><Title>Research Focus</Title></motion.div>
        <motion.div variants={fadeUp}><Body>{program.description}</Body></motion.div>
        <motion.div variants={fadeUp}>
          <FocusList>
            {program.focusAreas.map((a) => <FocusItem key={a}>{a}</FocusItem>)}
          </FocusList>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
