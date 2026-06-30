import { motion } from 'framer-motion';
import { Tag } from '@components/common/ui/Tag';
import { TextLink } from '@components/common/ui/TextLink';
import { getResearchAgenda, getActiveAreas } from '@lib/data/research';
import { Wrapper, Inner, Eyebrow, Title, Body, TagRow } from './HomeResearch.styles';

const agenda = getResearchAgenda();
const activeAreas = getActiveAreas();

const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } },
};

export function HomeResearch() {
  const firstParagraph = agenda.statement.split('\n\n')[0];

  return (
    <Wrapper>
      <Inner>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>Core Question</Eyebrow>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Title>How can large-scale AI systems use computation more effectively?</Title>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Body>{firstParagraph}</Body>
          </motion.div>
          <motion.div variants={fadeUp}>
            <TagRow>
              {activeAreas.map((area) => (
                <Tag key={area.id}>{area.title}</Tag>
              ))}
            </TagRow>
          </motion.div>
          <motion.div variants={fadeUp}>
            <TextLink to="/research">Read the full research agenda</TextLink>
          </motion.div>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
