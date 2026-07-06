import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';
import { getOpenProblems } from '@lib/data/research';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { Title, ProblemItem, ProblemNumber, ProblemText } from './ResearchOpenProblems.styles';

const problems = getOpenProblems();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ResearchOpenProblems() {
  const theme = useTheme();
  return (
    <Section paddingYTop="lg" paddingYBottom="lg" background={theme.colors.background.secondary}>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.08 }}>
        <Container>
          <motion.div variants={fadeUp}><Title>Open Problems</Title></motion.div>
          {problems.map((p, i) => (
            <motion.div key={p.id} variants={fadeUp}>
              <ProblemItem>
                <ProblemNumber>{String(i + 1).padStart(2, '0')}</ProblemNumber>
                <ProblemText>{p.question}</ProblemText>
              </ProblemItem>
            </motion.div>
          ))}
        </Container>
      </motion.div>
    </Section>
  );
}
