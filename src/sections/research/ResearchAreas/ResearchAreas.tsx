import { motion } from 'framer-motion';
import { Tag } from '@components/common/ui/Tag';
import { getActiveAreas } from '@lib/data/research';
import { Wrapper, Inner, Title, AreaBlock, AreaLeft, AreaTitle, TagRow, AreaDescription, AreaConnection } from './ResearchAreas.styles';

const areas = getActiveAreas();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ResearchAreas() {
  return (
    <Wrapper>
      <Inner>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.1 }}>
          <motion.div variants={fadeUp}><Title>Active Technical Areas</Title></motion.div>
          {areas.map((area) => (
            <motion.div key={area.id} variants={fadeUp}>
              <AreaBlock>
                <AreaLeft>
                  <AreaTitle>{area.title}</AreaTitle>
                  <TagRow>{area.labels.map((l) => <Tag key={l}>{l}</Tag>)}</TagRow>
                </AreaLeft>
                <div>
                  <AreaDescription>{area.description}</AreaDescription>
                  <AreaConnection>{area.connectionToAgenda}</AreaConnection>
                </div>
              </AreaBlock>
            </motion.div>
          ))}
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
