import { motion } from 'framer-motion';
import type { ProgramPage } from '@types';
import {
  Wrapper,
  Inner,
  SectionHeader,
  SectionLabel,
  SectionTitle,
  CitationList,
  CitationItem,
  CitationLeft,
  CitationTitle,
  CitationSource,
  CitationAnnotation,
} from './ProgramDetailReading.styles';

const spring = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: spring } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

interface Props { program: ProgramPage; }

export function ProgramDetailReading({ program }: Props) {
  return (
    <Wrapper>
      <Inner>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <SectionHeader>
            <motion.div variants={fadeUp}>
              <SectionLabel>Foundational Literature</SectionLabel>
            </motion.div>
            <motion.div variants={fadeUp}>
              <SectionTitle>Where we started reading.</SectionTitle>
            </motion.div>
          </SectionHeader>

          <CitationList>
            {program.literature.map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <CitationItem>
                  <CitationLeft>
                    <CitationTitle>{item.title}</CitationTitle>
                    <CitationSource>{item.source}</CitationSource>
                  </CitationLeft>
                  <CitationAnnotation>{item.annotation}</CitationAnnotation>
                </CitationItem>
              </motion.div>
            ))}
          </CitationList>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
