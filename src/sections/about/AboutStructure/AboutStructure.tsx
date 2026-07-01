import { motion } from 'framer-motion';
import {
  Wrapper,
  Inner,
  SectionHeader,
  Label,
  Title,
  ListContainer,
  ListItem,
  DivisionName,
  DivisionDot,
  DivisionFocus,
} from './AboutStructure.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

interface Division {
  name: string;
  focus: string;
  color: string;
}

interface Props {
  data: {
    label: string;
    title: string;
    items: Division[];
  };
}

export function AboutStructure({ data }: Props) {
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

          <ListContainer>
            {data.items.map((item, i) => (
              <motion.div key={item.name} variants={fadeUp}>
                <ListItem>
                  <DivisionName>
                    <DivisionDot $color={item.color} />
                    {item.name}
                  </DivisionName>
                  <DivisionFocus>{item.focus}</DivisionFocus>
                </ListItem>
              </motion.div>
            ))}
          </ListContainer>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
