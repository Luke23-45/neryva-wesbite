import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';
import { getTeam } from '@lib/data/lab';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { BorderTop, Title, Grid, Card, Name, Role, Bio } from './LabTeam.styles';
const team = getTeam();
const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } } };
export function LabTeam() {
  const theme = useTheme();
  return (
    <Section paddingY="md" background={theme.colors.background.primary}>
      <BorderTop>
        <Container>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.1 }}>
            <motion.div variants={fadeUp}><Title>Team</Title></motion.div>
            <Grid>
              {team.map((m, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card><Name>{m.name}</Name><Role>{m.role}</Role><Bio>{m.bio}</Bio></Card>
                </motion.div>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </BorderTop>
    </Section>
  );
}
