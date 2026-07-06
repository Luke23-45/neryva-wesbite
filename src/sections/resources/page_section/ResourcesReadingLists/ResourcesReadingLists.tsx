import { motion } from 'framer-motion';
import { getReadingLists } from '@lib/data/resources';
import { theme } from '@/styles/theme';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { BorderTop, Title, ClusterBlock, ClusterTitle, EmptyMessage } from './ResourcesReadingLists.styles';
const clusters = getReadingLists();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ResourcesReadingLists() {
  return (
    <Section paddingYTop="lg" paddingYBottom="lg" background={theme.colors.surface}>
      <BorderTop>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.08 }}>
          <Container>
            <motion.div variants={fadeUp}><Title>Reading Lists</Title></motion.div>
            {clusters.map((c) => (
              <motion.div key={c.topic} variants={fadeUp}>
                <ClusterBlock>
                  <ClusterTitle>{c.topic}</ClusterTitle>
                  {c.items.length > 0 ? <p>Items here.</p> : <EmptyMessage>Reading list in preparation.</EmptyMessage>}
                </ClusterBlock>
              </motion.div>
            ))}
          </Container>
        </motion.div>
      </BorderTop>
    </Section>
  );
}
