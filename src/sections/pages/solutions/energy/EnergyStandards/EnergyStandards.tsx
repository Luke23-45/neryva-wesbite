import { motion } from 'framer-motion';
import standardsData from '@neryva_data/solutions/energy/section2_standards.json';
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
} from './EnergyStandards.styles';

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

const EdgeIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="8" width="20" height="14" rx="1" stroke="currentColor" />
    <rect x="6" y="28" width="14" height="12" rx="1" stroke="currentColor" />
    <rect x="28" y="28" width="14" height="12" rx="1" stroke="currentColor" />
    <path d="M24 22 V28" stroke="currentColor" />
    <path d="M17 28 L24 22 L31 28" stroke="currentColor" fill="none" />
  </svg>
);

const ReasoningIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 12 H32 L40 20 V40 H8 V12 Z" stroke="currentColor" />
    <path d="M32 12 V20 H40" stroke="currentColor" />
    <line x1="14" y1="26" x2="34" y2="26" stroke="currentColor" />
    <line x1="14" y1="32" x2="28" y2="32" stroke="currentColor" />
    <line x1="14" y1="38" x2="22" y2="38" stroke="currentColor" />
  </svg>
);

const IntegrationIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="6" stroke="currentColor" />
    <circle cx="24" cy="8" r="4" stroke="currentColor" />
    <circle cx="24" cy="40" r="4" stroke="currentColor" />
    <circle cx="8" cy="24" r="4" stroke="currentColor" />
    <circle cx="40" cy="24" r="4" stroke="currentColor" />
    <line x1="24" y1="18" x2="24" y2="12" stroke="currentColor" />
    <line x1="24" y1="30" x2="24" y2="36" stroke="currentColor" />
    <line x1="18" y1="24" x2="12" y2="24" stroke="currentColor" />
    <line x1="30" y1="24" x2="36" y2="24" stroke="currentColor" />
  </svg>
);

const getIcon = (title: string) => {
  if (title.includes('Edge')) return <EdgeIcon />;
  if (title.includes('Reasoning')) return <ReasoningIcon />;
  return <IntegrationIcon />;
};

export function EnergyStandards() {
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
