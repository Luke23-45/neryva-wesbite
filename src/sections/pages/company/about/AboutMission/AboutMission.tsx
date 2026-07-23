import { motion } from 'framer-motion';
import { ShieldCheck, Scale, TrendingUp, Sparkles, LucideIcon } from 'lucide-react';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { theme } from '@/styles/theme';
import {
  SectionHeader,
  Label,
  Title,
  GridContainer,
  MissionCard,
  IconBadge,
  ContentWrapper,
  MissionTitle,
  MissionDesc,
} from './AboutMission.styles';

const MISSION_ICONS: Record<string, LucideIcon> = {
  'practical-delivery': ShieldCheck,
  'honest-scope': Scale,
  'measurable-outcomes': TrendingUp,
};

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
              const Icon = MISSION_ICONS[item.id] || Sparkles;
              return (
                <MissionCard key={item.id} variants={fadeUp} custom={index}>
                  <IconBadge>
                    <Icon />
                  </IconBadge>
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
