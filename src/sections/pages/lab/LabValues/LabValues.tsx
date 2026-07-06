import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';
import { getValues } from '@lib/data/lab';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { Title, ValueItem, ValueNumber, ValueText } from './LabValues.styles';
const values = getValues();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };
export function LabValues() {
  const theme = useTheme();
  return (
    <Section paddingYTop="lg" paddingYBottom="lg" background={theme.colors.background.secondary}>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.08 }}>
        <Container>
          <motion.div variants={fadeUp}><Title>Values</Title></motion.div>
          {values.map((v, i) => (
            <motion.div key={v.id} variants={fadeUp}>
              <ValueItem>
                <ValueNumber>{String(i + 1).padStart(2, '0')}</ValueNumber>
                <ValueText>{v.statement}</ValueText>
              </ValueItem>
            </motion.div>
          ))}
        </Container>
      </motion.div>
    </Section>
  );
}
