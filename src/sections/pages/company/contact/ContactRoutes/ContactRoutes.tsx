/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { getContactRoutes } from '@lib/data/contact';
import { theme } from '@/styles/theme';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { BorderTop, Title, Grid, Card, CardLabel, CardDescription, CardEmail } from './ContactRoutes.styles';
const routes = getContactRoutes();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };
export function ContactRoutes() {
  return (
    <Section paddingY="md" paddingYBottom="lg" background={theme.colors.surface}>
      <BorderTop>
        <Container><motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.1 }}>
          <motion.div variants={fadeUp}><Title>How to Reach Us</Title></motion.div>
          <Grid>
            {routes.map((r) => (
              <motion.div key={r.label} variants={fadeUp}>
                <Card>
                  <CardLabel>{r.label}</CardLabel>
                  <CardDescription>{r.description}</CardDescription>
                  <CardEmail href={`mailto:${r.email}`}>{r.email}</CardEmail>
                </Card>
              </motion.div>
            ))}
          </Grid>
        </motion.div></Container>
      </BorderTop>
    </Section>
  );
}
