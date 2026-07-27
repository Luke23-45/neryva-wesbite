import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { Eyebrow, Title, Description } from './LabHero.styles';
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };
export function LabHero() {
  const theme = useTheme();
  return (
    <Section paddingYTop="lg" paddingYBottom="sm" background={theme.colors.background.primary}>
      <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }}>
        <Container>
          <motion.div variants={fadeUp}><Eyebrow>Lab</Eyebrow></motion.div>
          <motion.div variants={fadeUp}><Title>Who we are, what we believe, and how we work.</Title></motion.div>
          <motion.div variants={fadeUp}>
            <Description>A small, focused AI research lab studying efficiency, stability, and deployability.</Description>
          </motion.div>
        </Container>
      </motion.div>
    </Section>
  );
}
