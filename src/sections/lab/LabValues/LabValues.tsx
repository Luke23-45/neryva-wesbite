import { motion } from 'framer-motion';
import { getValues } from '@lib/data/lab';
import { Wrapper, Inner, Title, ValueItem, ValueNumber, ValueText } from './LabValues.styles';
const values = getValues();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };
export function LabValues() {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.08 }}>
        <motion.div variants={fadeUp}><Title>Values</Title></motion.div>
        {values.map((v, i) => (
          <motion.div key={v.id} variants={fadeUp}>
            <ValueItem>
              <ValueNumber>{String(i + 1).padStart(2, '0')}</ValueNumber>
              <ValueText>{v.statement}</ValueText>
            </ValueItem>
          </motion.div>
        ))}
      </Inner>
    </Wrapper>
  );
}
