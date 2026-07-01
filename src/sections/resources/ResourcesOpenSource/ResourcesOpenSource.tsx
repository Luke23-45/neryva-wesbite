import { motion } from 'framer-motion';
import { getRepositories } from '@lib/data/resources';
import { theme } from '@/styles/theme';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { BorderTop, Title, Message } from './ResourcesOpenSource.styles';
const data = getRepositories();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };

export function ResourcesOpenSource() {
  return (
    <Section paddingY="md" background={theme.colors.paper}>
      <BorderTop>
        <Container as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.1 }}>
          <motion.div variants={fadeUp}><Title>Open Source</Title></motion.div>
          <motion.div variants={fadeUp}>
            {data.items.length > 0 ? <p>Repos here.</p> : <Message>{data.earlyStageMessage}</Message>}
          </motion.div>
        </Container>
      </BorderTop>
    </Section>
  );
}
