import { motion } from 'framer-motion';
import { TextLink } from '@components/common/ui/TextLink';
import { getPrograms } from '@lib/data/programs';
import {
  Wrapper, Inner, HeaderRow, Eyebrow, Title,
  Grid, Card, CardNumber, CardTitle, CardBody, CardLink,
} from './HomePrograms.styles';

const programs = getPrograms();

const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } },
};

export function HomePrograms() {
  return (
    <Wrapper>
      <Inner>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ staggerChildren: 0.08 }}
        >
          <motion.div variants={fadeUp}>
            <HeaderRow>
              <div>
                <Eyebrow>Programs</Eyebrow>
                <Title>Four research programs, one agenda.</Title>
              </div>
              <TextLink to="/programs">View all programs</TextLink>
            </HeaderRow>
          </motion.div>

          <Grid>
            {programs.map((program) => (
              <motion.div key={program.slug} variants={fadeUp}>
                <Card $accent={program.accent}>
                  <CardNumber>Program {program.number}</CardNumber>
                  <CardTitle>{program.title}</CardTitle>
                  <CardBody>{program.summary}</CardBody>
                  <CardLink>
                    <TextLink to={`/programs/${program.slug}`}>Learn more</TextLink>
                  </CardLink>
                </Card>
              </motion.div>
            ))}
          </Grid>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
