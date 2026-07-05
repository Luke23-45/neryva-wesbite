import { motion } from 'framer-motion';
import lifecycleData from '@neryva_data/products/deployment/section2_lifecycle.json';
import {
  SectionWrapper,
  InnerContainer,
  HeaderContent,
  Title,
  Subtitle,
  StepsGrid,
  StepCard,
  StepNumber,
  StepTitle,
  StepDescription
} from './DeploymentLifecycle.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: custom * 0.15 },
  }),
};

export function DeploymentLifecycle() {
  return (
    <SectionWrapper>
      <InnerContainer>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          custom={0}
        >
          <HeaderContent>
            <Title>{lifecycleData.title}</Title>
            <Subtitle>{lifecycleData.subtitle}</Subtitle>
          </HeaderContent>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          custom={1}
        >
          <StepsGrid>
            {lifecycleData.steps.map((step) => (
              <StepCard key={step.step}>
                <StepNumber>[ {step.step} ]</StepNumber>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </StepCard>
            ))}
          </StepsGrid>
        </motion.div>
      </InnerContainer>
    </SectionWrapper>
  );
}
