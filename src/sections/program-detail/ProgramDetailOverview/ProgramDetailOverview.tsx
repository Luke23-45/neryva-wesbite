import { motion } from 'framer-motion';
import type { ProgramPage } from '@types';
import { Wrapper, Inner, Label, SectionTitle, TextBlock } from './ProgramDetailOverview.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: custom * 0.15 },
  }),
};

interface Props {
  program: ProgramPage;
}

export function ProgramDetailOverview({ program }: Props) {
  return (
    <Wrapper>
      <Inner>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
          <motion.div variants={fadeUp} custom={0}>
            <Label $accent={program.accent}>The Bottleneck</Label>
            <SectionTitle>The Problem</SectionTitle>
            <TextBlock>{program.problem}</TextBlock>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <Label $accent={program.accent}>Our Thesis</Label>
            <SectionTitle>Our Approach</SectionTitle>
            <TextBlock>{program.approach}</TextBlock>
          </motion.div>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
