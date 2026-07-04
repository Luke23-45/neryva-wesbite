import { motion } from 'framer-motion';
import deploymentData from '@neryva_data/home/sections/deployment.json';
import {
  SectionWrapper,
  InnerContainer,
  HeaderContent,
  Title,
  Subtitle,
  CardsGrid,
  ArchitectureCard,
  CardIconWrapper,
  CardTextContent,
  CardLabel,
  CardTitle,
  CardDescription,
} from './HomeDeployment.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: custom * 0.15 },
  }),
};

// Abstract, hairline SVG blueprints
const VpcBlueprint = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="56" height="56" stroke="currentColor" strokeDasharray="2 2" />
    <rect x="16" y="16" width="32" height="32" stroke="currentColor" />
    <path d="M32 16 V4 M32 48 V60 M16 32 H4 M48 32 H60" stroke="currentColor" />
  </svg>
);

const OnPremBlueprint = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="12" width="40" height="40" stroke="currentColor" />
    <rect x="20" y="20" width="24" height="24" stroke="currentColor" />
    <circle cx="32" cy="32" r="4" fill="currentColor" />
    <path d="M12 12 L20 20 M52 12 L44 20 M12 52 L20 44 M52 52 L44 44" stroke="currentColor" />
  </svg>
);

const ApiBlueprint = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" stroke="currentColor" />
    <circle cx="32" cy="32" r="16" stroke="currentColor" strokeDasharray="4 4" />
    <circle cx="32" cy="32" r="4" fill="currentColor" />
    <path d="M32 4 L32 16 M32 48 L32 60 M4 32 L16 32 M48 32 L60 32" stroke="currentColor" />
  </svg>
);

const getBlueprint = (id: string) => {
  switch (id) {
    case 'vpc': return <VpcBlueprint />;
    case 'retention': return <OnPremBlueprint />;
    case 'throughput': return <ApiBlueprint />;
    default: return <ApiBlueprint />;
  }
};

export function HomeDeployment() {
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
            <Title>{deploymentData.header.title}</Title>
            <Subtitle>{deploymentData.header.subtitle}</Subtitle>
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
            {deploymentData.pillars.map((pillar) => (
              <ArchitectureCard key={pillar.id}>
                <CardIconWrapper>
                  {getBlueprint(pillar.id)}
                </CardIconWrapper>
                
                <CardTextContent>
                  <CardLabel>Deployment Architecture</CardLabel>
                  <CardTitle>{pillar.title}</CardTitle>
                  <CardDescription>{pillar.description}</CardDescription>
                </CardTextContent>
              </ArchitectureCard>
            ))}
          </CardsGrid>
        </motion.div>
      </InnerContainer>
    </SectionWrapper>
  );
}
