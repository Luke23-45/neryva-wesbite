import { motion } from 'framer-motion';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { theme } from '@/styles/theme';
import { MissionFeatureIcon } from '@/assets/visual/company/aboutmissionicon';
import {
  SectionHeader,
  Label,
  Title,
  GridContainer,
  MissionCard,
  ContentWrapper,
  MissionTitle,
  MissionDesc,
} from './AboutMission.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

interface MissionItem {
  id: string;
  title: string;
  description: string;
}

interface Props {
  data: {
    label: string;
    title: string;
    items: MissionItem[];
  };
}

export function AboutMission({ data }: Props) {
  return (
    <Section paddingYTop="md" paddingYBottom="sm" background={theme.colors.background.primary}>
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

          <GridContainer as={motion.div} variants={fadeUp}>
            {data.items.map((item, index) => {
              return (
                <MissionCard key={item.id} variants={fadeUp} custom={index}>
                  <MissionFeatureIcon id={item.id} iconColor="#FF5500" style={{ marginBottom: 24 }} />
                  <ContentWrapper>
                    <MissionTitle>{item.title}</MissionTitle>
                    <MissionDesc>{item.description}</MissionDesc>
                  </ContentWrapper>
                </MissionCard>
              );
            })}
          </GridContainer>
        </motion.div>
      </Container>
    </Section>
  );
}
