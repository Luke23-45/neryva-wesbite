import { motion } from 'framer-motion';
import { getTeam } from '@lib/data/lab';
import { Wrapper, Inner, Title, Grid, Card, Name, Role, Bio } from './LabTeam.styles';
const team = getTeam();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };
export function LabTeam() {
  return (
    <Wrapper>
      <Inner as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.1 }}>
        <motion.div variants={fadeUp}><Title>Team</Title></motion.div>
        <Grid>
          {team.map((m, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card><Name>{m.name}</Name><Role>{m.role}</Role><Bio>{m.bio}</Bio></Card>
            </motion.div>
          ))}
        </Grid>
      </Inner>
    </Wrapper>
  );
}
