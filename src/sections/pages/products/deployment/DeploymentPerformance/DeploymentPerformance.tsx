import { motion } from 'framer-motion';
import performanceData from '@neryva_data/products/deployment/section3_performance.json';
import {
  SectionWrapper,
  InnerContainer,
  StickyColumn,
  StickyContent,
  Eyebrow,
  Title,
  Description,
  FeaturesColumn,
  FeatureCard,
  FeatureTitle,
  FeatureDescription
} from './DeploymentPerformance.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: custom * 0.15 },
  }),
};

export function DeploymentPerformance() {
  return (
    <SectionWrapper>
      <InnerContainer>
        <StickyColumn>
          <StickyContent>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeUp}
              custom={0}
            >
              <Eyebrow>{performanceData.title}</Eyebrow>
              <Title>{performanceData.subtitle}</Title>
              <Description>{performanceData.description}</Description>
            </motion.div>
          </StickyContent>
        </StickyColumn>

        <FeaturesColumn>
          {performanceData.features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeUp}
              custom={1 + index}
            >
              <FeatureCard>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            </motion.div>
          ))}
        </FeaturesColumn>
      </InnerContainer>
    </SectionWrapper>
  );
}
