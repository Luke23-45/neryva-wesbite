import { motion } from 'framer-motion';
import { theme } from '@/styles/theme';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { Eyebrow, Title, Description } from './ProgramsHero.styles';

const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ProgramsHero() {
  return (
    <Section paddingYTop="lg" paddingYBottom="sm" background={theme.colors.background.primary}>
      <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }}>
      <Container>
        <motion.div variants={fadeUp}><Eyebrow>Programs</Eyebrow></motion.div>
        <motion.div variants={fadeUp}><Title>How our research agenda is organized.</Title></motion.div>
        <motion.div variants={fadeUp}>
          <Description>
            Four programs â€" one primary focus, three connected areas â€" all organized around efficiency, reliability, and deployment under real constraints.
          </Description>
        </motion.div>
      </Container>
      </motion.div>
    </Section>
  );
}
