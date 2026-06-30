import { motion } from 'framer-motion';
import { getResearchAgenda } from '@lib/data/research';
import { Wrapper, Inner, Title, Paragraph } from './ResearchAgenda.styles';

const agenda = getResearchAgenda();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ResearchAgenda() {
  const paragraphs = agenda.statement.split('\n\n');
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.08 }}>
        <motion.div variants={fadeUp}><Title>Research Agenda</Title></motion.div>
        {paragraphs.map((p, i) => (
          <motion.div key={i} variants={fadeUp}><Paragraph>{p}</Paragraph></motion.div>
        ))}
      </Inner>
    </Wrapper>
  );
}
