import { motion } from 'framer-motion';
import type { ProgramPage } from '@types';
import {
  Wrapper,
  Inner,
  SideLabel,
  SectionLabel,
  SectionTitle,
  ArgumentBody,
  ArgumentParagraph,
} from './ProgramDetailFocus.styles';

const spring = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: spring } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

interface Props { program: ProgramPage; }

export function ProgramDetailFocus({ program }: Props) {
  return (
    <Wrapper>
      <Inner>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
        >
          <SideLabel>
            <motion.div variants={fadeUp}>
              <SectionLabel>The Argument</SectionLabel>
            </motion.div>
            <motion.div variants={fadeUp}>
              <SectionTitle>Why this matters.</SectionTitle>
            </motion.div>
          </SideLabel>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
        >
          <ArgumentBody>
            {program.argument.map((para, i) => (
              <motion.div key={i} variants={fadeUp}>
                <ArgumentParagraph>{para}</ArgumentParagraph>
              </motion.div>
            ))}
          </ArgumentBody>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
