import { motion } from 'framer-motion';
import type { ProgramPage } from '@types';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { theme } from '@/styles/theme';
import {
  SectionHeader,
  SectionLabel,
  SectionTitle,
  ThreadList,
  ThreadItem,
  ThreadIndex,
  ThreadContent,
  ThreadTitle,
  ThreadQuestion,
} from './ProgramDetailQuestions.styles';

const spring = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: spring } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

interface Props { program: ProgramPage; }

export function ProgramDetailQuestions({ program }: Props) {
  return (
    <Section paddingY="lg" background={theme.colors.background.secondary}>
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <SectionHeader>
            <motion.div variants={fadeUp}>
              <SectionLabel>Active Threads</SectionLabel>
            </motion.div>
            <motion.div variants={fadeUp}>
              <SectionTitle>What we're actively working out.</SectionTitle>
            </motion.div>
          </SectionHeader>

          <ThreadList>
            {program.threads.map((thread, i) => (
              <motion.div key={thread.id} variants={fadeUp}>
                <ThreadItem>
                  <ThreadIndex>{String(i + 1).padStart(2, '0')}</ThreadIndex>
                  <ThreadContent>
                    <ThreadTitle>{thread.title}</ThreadTitle>
                    <ThreadQuestion>{thread.question}</ThreadQuestion>
                  </ThreadContent>
                </ThreadItem>
              </motion.div>
            ))}
          </ThreadList>
        </motion.div>
      </Container>
    </Section>
  );
}
