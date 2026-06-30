import { motion } from 'framer-motion';
import { getContactRoutes } from '@lib/data/contact';
import { Wrapper, Inner, Title, Grid, Card, CardLabel, CardDescription, CardEmail } from './ContactRoutes.styles';
const routes = getContactRoutes();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };
export function ContactRoutes() {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.1 }}>
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
      </Inner>
    </Wrapper>
  );
}
