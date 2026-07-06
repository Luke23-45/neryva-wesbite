import { motion } from 'framer-motion';
import standardsData from '@neryva_data/solutions/engineering/section2_standards.json';
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
} from './EngineeringStandards.styles';

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

const PlmIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="14" height="32" rx="1" stroke="currentColor" />
    <rect x="26" y="8" width="14" height="32" rx="1" stroke="currentColor" />
    <path d="M22 20 L26 20" stroke="currentColor" />
    <path d="M22 28 L26 28" stroke="currentColor" />
    <line x1="12" y1="16" x2="18" y2="16" stroke="currentColor" />
    <line x1="12" y1="22" x2="18" y2="22" stroke="currentColor" />
    <line x1="12" y1="28" x2="18" y2="28" stroke="currentColor" />
    <line x1="12" y1="34" x2="18" y2="34" stroke="currentColor" />
    <line x1="30" y1="16" x2="36" y2="16" stroke="currentColor" />
    <line x1="30" y1="22" x2="36" y2="22" stroke="currentColor" />
    <line x1="30" y1="28" x2="36" y2="28" stroke="currentColor" />
  </svg>
);

const SchematicIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="12" width="32" height="24" rx="1" stroke="currentColor" />
    <circle cx="20" cy="24" r="6" stroke="currentColor" />
    <line x1="30" y1="20" x2="36" y2="20" stroke="currentColor" />
    <line x1="30" y1="24" x2="36" y2="24" stroke="currentColor" />
    <line x1="30" y1="28" x2="36" y2="28" stroke="currentColor" />
    <line x1="14" y1="36" x2="14" y2="42" stroke="currentColor" />
    <line x1="34" y1="36" x2="34" y2="42" stroke="currentColor" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 6 L38 12 V22 C38 30 32 36 24 40 C16 36 10 30 10 22 V12 L24 6 Z" stroke="currentColor" />
    <path d="M18 22 L22 26 L30 18" stroke="currentColor" />
  </svg>
);

const getIcon = (title: string) => {
  if (title.includes('PLM')) return <PlmIcon />;
  if (title.includes('Multi')) return <SchematicIcon />;
  return <ShieldIcon />;
};

export function EngineeringStandards() {
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
