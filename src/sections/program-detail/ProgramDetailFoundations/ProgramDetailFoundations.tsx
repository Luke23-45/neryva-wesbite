import { motion } from 'framer-motion';
import type { ProgramPage } from '@types';
import {
  Wrapper,
  Inner,
  FoundationsColumn,
  Label,
  SectionTitle,
  PaperList,
  PaperItem,
  PaperTitle,
  PaperSource,
  PaperRelevance,
  CtaColumn,
  CtaTitle,
  CtaText,
  CtaButton,
} from './ProgramDetailFoundations.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any, delay: custom * 0.1 },
  }),
};

interface Props {
  program: ProgramPage;
}

export function ProgramDetailFoundations({ program }: Props) {
  return (
    <Wrapper>
      <Inner>
        <FoundationsColumn>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
            <motion.div variants={fadeUp} custom={0}>
              <Label $accent={program.accent}>Literature</Label>
              <SectionTitle>Foundational Work</SectionTitle>
            </motion.div>

            <PaperList>
              {program.foundations.map((paper, index) => (
                <motion.div key={paper.title} variants={fadeUp} custom={index + 1}>
                  <PaperItem>
                    <PaperTitle>{paper.title}</PaperTitle>
                    <PaperSource>{paper.source}</PaperSource>
                    <PaperRelevance>{paper.relevance}</PaperRelevance>
                  </PaperItem>
                </motion.div>
              ))}
            </PaperList>
          </motion.div>
        </FoundationsColumn>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: 0.4 }}
        >
          <CtaColumn>
            <CtaTitle>Join the Research</CtaTitle>
            <CtaText>
              We are actively looking for researchers and engineers who want to solve these specific problems at scale.
            </CtaText>
            <CtaButton href="/lab/careers" $accent={program.accent}>
              View Open Roles
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </CtaButton>
          </CtaColumn>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
