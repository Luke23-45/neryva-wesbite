import { motion } from 'framer-motion';
import {
  Wrapper,
  Inner,
  SectionHeader,
  Label,
  Title,
  GridContainer,
  PrincipleCard,
  NumberLabel,
  PrincipleTitle,
  PrincipleDesc,
} from './AboutPrinciples.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

interface Principle {
  id: string;
  title: string;
  description: string;
}

interface Props {
  data: {
    label: string;
    title: string;
    items: Principle[];
  };
}

export function AboutPrinciples({ data }: Props) {
  return (
    <Wrapper>
      <Inner>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
          <SectionHeader>
            <motion.div variants={fadeUp}>
              <Label>{data.label}</Label>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Title>{data.title}</Title>
            </motion.div>
          </SectionHeader>

          <GridContainer as={motion.div} variants={fadeUp}>
            {data.items.map((item) => (
              <PrincipleCard key={item.id}>
                <NumberLabel>{item.id}</NumberLabel>
                <PrincipleTitle>{item.title}</PrincipleTitle>
                <PrincipleDesc>{item.description}</PrincipleDesc>
              </PrincipleCard>
            ))}
          </GridContainer>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
