import { motion } from 'framer-motion';
import standardsData from '@neryva_data/solutions/healthcare/section2_standards.json';
import {
  SectionWrapper,
  InnerContainer,
  HeaderContent,
  Eyebrow,
  Title,
  Subtitle,
  CardsGrid,
  StandardCard,
  CardIconWrapper,
  CardTitle,
  CardDescription
} from './HealthcareStandards.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: custom * 0.15 },
  }),
};

// Abstract geometric blueprints for standards
const SecurityIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="24" width="32" height="32" stroke="currentColor" />
    <path d="M24 24 V16 C24 11 28 8 32 8 C36 8 40 11 40 16 V24" stroke="currentColor" />
    <circle cx="32" cy="40" r="4" fill="currentColor" />
  </svg>
);

const ReasoningIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 16 H40 L52 28 V52 H12 V16 Z" stroke="currentColor" />
    <path d="M40 16 V28 H52" stroke="currentColor" />
    <line x1="20" y1="36" x2="44" y2="36" stroke="currentColor" />
    <line x1="20" y1="44" x2="36" y2="44" stroke="currentColor" />
  </svg>
);

const TraceabilityIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="16" r="8" stroke="currentColor" />
    <circle cx="16" cy="48" r="8" stroke="currentColor" />
    <circle cx="48" cy="48" r="8" stroke="currentColor" />
    <path d="M28 23 L20 41 M36 23 L44 41" stroke="currentColor" />
    <circle cx="32" cy="32" r="3" fill="currentColor" />
  </svg>
);

const getIcon = (title: string) => {
  if (title.includes('Security')) return <SecurityIcon />;
  if (title.includes('Reasoning')) return <ReasoningIcon />;
  return <TraceabilityIcon />;
};

export function HealthcareStandards() {
  return (
    <SectionWrapper>
      <InnerContainer>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
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
          viewport={{ once: true, margin: '-100px' }}
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
