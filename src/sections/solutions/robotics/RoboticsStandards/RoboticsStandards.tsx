import { motion } from 'framer-motion';
import standardsData from '@neryva_data/solutions/robotics/section2_standards.json';
import {
  SectionWrapper,
  InnerContainer,
  HeaderContent,
  Eyebrow,
  Title,
  CardsGrid,
  StandardCard,
  CardIconWrapper,
  CardTitle,
  CardDescription,
} from './RoboticsStandards.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
      delay: custom * 0.1,
    },
  }),
};

const ChipIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="12" width="24" height="24" rx="1" stroke="currentColor" />
    <rect x="18" y="18" width="12" height="12" rx="1" stroke="currentColor" />
    <line x1="20" y1="12" x2="20" y2="6" stroke="currentColor" />
    <line x1="28" y1="12" x2="28" y2="6" stroke="currentColor" />
    <line x1="20" y1="36" x2="20" y2="42" stroke="currentColor" />
    <line x1="28" y1="36" x2="28" y2="42" stroke="currentColor" />
    <line x1="12" y1="20" x2="6" y2="20" stroke="currentColor" />
    <line x1="12" y1="28" x2="6" y2="28" stroke="currentColor" />
    <line x1="36" y1="20" x2="42" y2="20" stroke="currentColor" />
    <line x1="36" y1="28" x2="42" y2="28" stroke="currentColor" />
  </svg>
);

const SensorIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="16" stroke="currentColor" />
    <circle cx="24" cy="24" r="8" stroke="currentColor" />
    <circle cx="24" cy="24" r="2" fill="currentColor" />
    <line x1="24" y1="4" x2="24" y2="8" stroke="currentColor" />
    <line x1="24" y1="40" x2="24" y2="44" stroke="currentColor" />
    <line x1="4" y1="24" x2="8" y2="24" stroke="currentColor" />
    <line x1="40" y1="24" x2="44" y2="24" stroke="currentColor" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="22" width="24" height="20" rx="1" stroke="currentColor" />
    <path d="M18 22 V16 C18 11 20 8 24 8 C28 8 30 11 30 16 V22" stroke="currentColor" />
    <circle cx="24" cy="32" r="3" fill="currentColor" />
    <line x1="24" y1="35" x2="24" y2="38" stroke="currentColor" />
  </svg>
);

const getIcon = (title: string) => {
  if (title.includes('Hardware')) return <ChipIcon />;
  if (title.includes('Sensor')) return <SensorIcon />;
  return <LockIcon />;
};

export function RoboticsStandards() {
  return (
    <SectionWrapper>
      <InnerContainer>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          custom={0}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <HeaderContent>
            <Eyebrow>{standardsData.title}</Eyebrow>
            <Title>{standardsData.subtitle}</Title>
          </HeaderContent>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          custom={1}
          style={{ width: '100%' }}
        >
          <CardsGrid>
            {standardsData.features.map((feature) => (
              <StandardCard key={feature.title}>
                <CardIconWrapper>
                  {getIcon(feature.title)}
                </CardIconWrapper>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </StandardCard>
            ))}
          </CardsGrid>
        </motion.div>
      </InnerContainer>
    </SectionWrapper>
  );
}
