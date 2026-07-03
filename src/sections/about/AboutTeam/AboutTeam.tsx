import { motion } from 'framer-motion';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { theme } from '@/styles/theme';
import {
  BorderTop,
  SectionHeader,
  Label,
  Title,
  ListContainer,
  ListItem,
  TeamName,
  TeamFocus,
} from './AboutTeam.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

interface TeamItem {
  name: string;
  focus: string;
}

interface Props {
  data: {
    label: string;
    title: string;
    items: TeamItem[];
  };
}

export function AboutTeam({ data }: Props) {
  return (
    <Section paddingY="lg" background={theme.colors.background.secondary}>
      <BorderTop>
        <Container>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
            <SectionHeader>
              <motion.div variants={fadeUp}>
                <Label>{data.label}</Label>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Title>{data.title}</Title>
              </motion.div>
            </SectionHeader>

            <ListContainer>
              {data.items.map((item, index) => (
                <motion.div key={item.name} variants={fadeUp} custom={index}>
                  <ListItem>
                    <TeamName>{item.name}</TeamName>
                    <TeamFocus>{item.focus}</TeamFocus>
                  </ListItem>
                </motion.div>
              ))}
            </ListContainer>
          </motion.div>
        </Container>
      </BorderTop>
    </Section>
  );
}
