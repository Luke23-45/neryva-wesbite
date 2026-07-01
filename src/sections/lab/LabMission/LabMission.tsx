import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';
import { getMission } from '@lib/data/lab';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { BorderTop, Title, Paragraph } from './LabMission.styles';
const mission = getMission();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };
export function LabMission() {
  const theme = useTheme();
  const paragraphs = mission.statement.split('\n\n');
  return (
    <Section paddingY="md" background={theme.colors.surface}>
      <BorderTop>
        <Container variant="prose">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.08 }}>
            <motion.div variants={fadeUp}><Title>Mission</Title></motion.div>
            {paragraphs.map((p, i) => (
              <motion.div key={i} variants={fadeUp}><Paragraph>{p}</Paragraph></motion.div>
            ))}
          </motion.div>
        </Container>
      </BorderTop>
    </Section>
  );
}
