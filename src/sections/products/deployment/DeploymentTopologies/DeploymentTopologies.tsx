import { motion } from 'framer-motion';
import topologiesData from '@neryva_data/products/deployment/section4_topologies.json';
import {
  SectionWrapper,
  InnerContainer,
  HeaderContent,
  Eyebrow,
  Title,
  Subtitle,
  CardsGrid,
  TopologyCard,
  CardIconWrapper,
  CardTitle,
  CardDescription
} from './DeploymentTopologies.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: custom * 0.15 },
  }),
};

// Abstract geometric blueprints for topologies
const CloudVpcIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="48" height="48" stroke="currentColor" strokeDasharray="3 3" />
    <circle cx="32" cy="32" r="16" stroke="currentColor" />
    <path d="M32 16 V8 M32 48 V56 M16 32 H8 M48 32 H56" stroke="currentColor" />
  </svg>
);

const OnPremIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="16" width="32" height="32" stroke="currentColor" />
    <rect x="24" y="24" width="16" height="16" stroke="currentColor" />
    <path d="M16 16 L0 0 M48 16 L64 0 M16 48 L0 64 M48 48 L64 64" stroke="currentColor" strokeDasharray="2 2" />
  </svg>
);

const EdgeIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="24" stroke="currentColor" />
    <circle cx="32" cy="32" r="8" fill="currentColor" />
    <path d="M32 8 L32 24 M32 40 L32 56 M8 32 L24 32 M40 32 L56 32" stroke="currentColor" />
  </svg>
);

const getIcon = (title: string) => {
  if (title.includes('VPC')) return <CloudVpcIcon />;
  if (title.includes('Premise')) return <OnPremIcon />;
  return <EdgeIcon />;
};

export function DeploymentTopologies() {
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
            <Eyebrow>{topologiesData.title}</Eyebrow>
            <Title>{topologiesData.subtitle}</Title>
            <Subtitle>{topologiesData.description}</Subtitle>
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
            {topologiesData.cards.map((card) => (
              <TopologyCard key={card.title}>
                <CardIconWrapper>
                  {getIcon(card.title)}
                </CardIconWrapper>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </TopologyCard>
            ))}
          </CardsGrid>
        </motion.div>
      </InnerContainer>
    </SectionWrapper>
  );
}
