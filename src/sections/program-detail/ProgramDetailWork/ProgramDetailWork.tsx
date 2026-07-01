import { motion } from 'framer-motion';
import type { ProgramPage } from '@types';
import {
  Wrapper,
  Inner,
  StatusBlock,
  BlockLabel,
  StatusIndicator,
  StatusBody,
  FutureBlock,
  FutureBody,
} from './ProgramDetailWork.styles';

const spring = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: spring } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };

interface Props { program: ProgramPage; }

export function ProgramDetailWork({ program }: Props) {
  return (
    <Wrapper>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={stagger}
      >
        <Inner>
          <StatusBlock>
            <motion.div variants={fadeUp}>
              <BlockLabel>Status — Current Work</BlockLabel>
              <StatusIndicator $accent={program.accent}>{program.status}</StatusIndicator>
              <StatusBody>{program.currentWork}</StatusBody>
            </motion.div>
          </StatusBlock>

          <FutureBlock>
            <motion.div variants={fadeUp}>
              <BlockLabel>Future Direction</BlockLabel>
              <FutureBody>{program.futureDirection}</FutureBody>
            </motion.div>
          </FutureBlock>
        </Inner>
      </motion.div>
    </Wrapper>
  );
}
