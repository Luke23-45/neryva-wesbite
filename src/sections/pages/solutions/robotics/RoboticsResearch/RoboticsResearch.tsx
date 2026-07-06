import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import researchData from '@neryva_data/solutions/robotics/section4_research.json';
import {
  SectionWrapper,
  InnerContainer,
  StickyColumn,
  StickyContent,
  Eyebrow,
  Title,
  Subtitle,
  ArtifactsColumn,
  ArtifactCard,
  ArtifactType,
  ArtifactTitle,
  ArtifactAction,
} from './RoboticsResearch.styles';

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

export function RoboticsResearch() {
  return (
    <SectionWrapper>
      <InnerContainer>
        <StickyColumn>
          <StickyContent>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={fadeUp}
              custom={0}
            >
              <Eyebrow>{researchData.title}</Eyebrow>
              <Title>{researchData.subtitle}</Title>
              <Subtitle>{researchData.description}</Subtitle>
            </motion.div>
          </StickyContent>
        </StickyColumn>

        <ArtifactsColumn>
          {researchData.artifacts.map((artifact, index) => (
            <motion.div
              key={artifact.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={1 + index}
            >
              <ArtifactCard href={artifact.href}>
                <ArtifactType>{artifact.type}</ArtifactType>
                <ArtifactTitle>{artifact.title}</ArtifactTitle>
                <ArtifactAction>
                  Read Note
                  <ArrowRight size={14} strokeWidth={2} />
                </ArtifactAction>
              </ArtifactCard>
            </motion.div>
          ))}
        </ArtifactsColumn>
      </InnerContainer>
    </SectionWrapper>
  );
}
