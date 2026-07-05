import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import artifactsData from '@neryva_data/products/deployment/section5_artifacts.json';
import {
  SectionWrapper,
  InnerContainer,
  HeaderContent,
  Eyebrow,
  Title,
  Subtitle,
  ArtifactsList,
  ArtifactRow,
  ArtifactInfo,
  ArtifactType,
  ArtifactTitle,
  ArtifactAction
} from './DeploymentArtifacts.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: custom * 0.15 },
  }),
};

export function DeploymentArtifacts() {
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
            <Eyebrow>{artifactsData.title}</Eyebrow>
            <Title>{artifactsData.subtitle}</Title>
            <Subtitle>{artifactsData.description}</Subtitle>
          </HeaderContent>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          custom={1}
        >
          <ArtifactsList>
            {artifactsData.articles.map((article) => (
              <ArtifactRow key={article.title} href={article.href}>
                <ArtifactInfo>
                  <ArtifactType>{article.type}</ArtifactType>
                  <ArtifactTitle>{article.title}</ArtifactTitle>
                </ArtifactInfo>
                <ArtifactAction>
                  Read
                  <ArrowUpRight size={16} strokeWidth={2} />
                </ArtifactAction>
              </ArtifactRow>
            ))}
          </ArtifactsList>
        </motion.div>
      </InnerContainer>
    </SectionWrapper>
  );
}
