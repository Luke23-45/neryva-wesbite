import { motion } from 'framer-motion';
import {
  Wrapper,
  Inner,
  SectionHeader,
  Label,
  Title,
  GridContainer,
  PerkCard,
  LetterMark,
  PerkTitle,
  PerkDesc,
} from './CareersEnvironment.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

interface Perk {
  id: string;
  title: string;
  description: string;
}

interface Props {
  data: {
    label: string;
    title: string;
    items: Perk[];
  };
}

export function CareersEnvironment({ data }: Props) {
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
              <PerkCard key={item.id}>
                <LetterMark>{item.id}</LetterMark>
                <PerkTitle>{item.title}</PerkTitle>
                <PerkDesc>{item.description}</PerkDesc>
              </PerkCard>
            ))}
          </GridContainer>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
