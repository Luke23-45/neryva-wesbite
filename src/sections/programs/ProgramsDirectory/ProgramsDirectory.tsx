import { motion } from 'framer-motion';
import { Tag } from '@/components/common/ui/Tag';
import { TextLink } from '@/components/common/ui/TextLink';
import { getPrograms } from '@lib/data/programs';
import { Wrapper, Inner, Card, CardMeta, CardNumber, CardTitle, CardBody } from './ProgramsDirectory.styles';

const programs = getPrograms();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ProgramsDirectory() {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.1 }}>
        {programs.map((p) => (
          <motion.div key={p.slug} variants={fadeUp}>
            <Card $accent={p.accent}>
              <CardMeta>
                <CardNumber>Program {p.number}</CardNumber>
                <Tag color={p.accent}>{p.number === 1 ? 'Primary Focus' : 'Active'}</Tag>
              </CardMeta>
              <CardTitle>{p.title}</CardTitle>
              <CardBody>{p.summary}</CardBody>
              <TextLink to={`/programs/${p.slug}`}>View program details</TextLink>
            </Card>
          </motion.div>
        ))}
      </Inner>
    </Wrapper>
  );
}
