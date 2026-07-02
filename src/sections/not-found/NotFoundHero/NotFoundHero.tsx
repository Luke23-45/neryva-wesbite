import { motion } from 'framer-motion';
import { TextLink } from '@/components/common/ui/TextLink';
import { theme } from '@/styles/theme';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { CenterWrap, Code, Title, Message } from './NotFoundHero.styles';
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };
export function NotFoundHero() {
  return (
    <Section paddingYTop="lg" paddingYBottom="lg" background={theme.colors.background.primary}>
      <CenterWrap>
        <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }}>
        <Container>
          <motion.div variants={fadeUp}><Code>404</Code></motion.div>
          <motion.div variants={fadeUp}><Title>Page not found.</Title></motion.div>
          <motion.div variants={fadeUp}><Message>This page does not exist or may have been moved.</Message></motion.div>
          <motion.div variants={fadeUp}><TextLink to="/">Return to home</TextLink></motion.div>
        </Container>
        </motion.div>
      </CenterWrap>
    </Section>
  );
}
