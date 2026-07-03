import { motion } from 'framer-motion';
import type { ProgramPage } from '@types';
import {
  Wrapper,
  Inner,
  Header,
  Label,
  Title,
  Grid,
  VectorCard,
  VectorTitle,
  VectorDescription,
} from './ProgramDetailVectors.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any, delay: custom * 0.1 },
  }),
};

interface Props {
  program: ProgramPage;
}

export function ProgramDetailVectors({ program }: Props) {
  return (
    <Wrapper>
      <Inner>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
          <Header>
            <motion.div variants={fadeUp} custom={0}>
              <Label $accent={program.accent}>Active Research</Label>
              <Title>Research Focus</Title>
            </motion.div>
          </Header>

          <Grid>
            {program.vectors.map((vector, index) => (
              <motion.div key={vector.id} variants={fadeUp} custom={index + 1}>
                <VectorCard>
                  <VectorTitle>{vector.title}</VectorTitle>
                  <VectorDescription>{vector.description}</VectorDescription>
                </VectorCard>
              </motion.div>
            ))}
          </Grid>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
