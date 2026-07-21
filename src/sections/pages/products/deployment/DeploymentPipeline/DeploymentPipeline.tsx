import { useRef, useEffect, useState } from 'react';
import { useTheme } from 'styled-components';
import { motion } from 'framer-motion';
import { useUiStore } from '@store/uiStore';
import { Container } from '@/sections/common/layout/Container';
import { Section } from '@/sections/common/layout/Section';
import {
  CloudCog as CloudCogLucide,
  Server as ServerLucide,
  KeyRound as KeyRoundLucide,
  Gauge as GaugeLucide,
  Activity as ActivityLucide,
  FileCheck as FileCheckLucide,
  Headphones as HeadphonesLucide,
} from 'lucide-react';

import section1 from '@neryva_data/products/deployment/section1.json';
import section2 from '@neryva_data/products/deployment/section2.json';
import section3 from '@neryva_data/products/deployment/section3.json';
import section4 from '@neryva_data/products/deployment/section4.json';
import section5 from '@neryva_data/products/deployment/section5.json';
import section6 from '@neryva_data/products/deployment/section6.json';
import section7 from '@neryva_data/products/deployment/section7.json';

import imgSection1 from '@assets/page/product/deployment/deployment_pipeline_section1.png';
import imgSection2 from '@assets/page/product/deployment/deployment_pipeline_section2.png';
import imgSection3 from '@assets/page/product/deployment/deployment_pipeline_section3.png';
import imgSection4 from '@assets/page/product/deployment/deployment_pipeline_section4.png';
import imgSection5 from '@assets/page/product/deployment/deployment_pipeline_section5.png';
import imgSection6 from '@assets/page/product/deployment/deployment_pipeline_section6.png';
import imgSection7 from '@assets/page/product/deployment/deployment_pipeline_section7.png';

const imageMapping: Record<string, string> = {
  deployment_pipeline_section1: imgSection1,
  deployment_pipeline_section2: imgSection2,
  deployment_pipeline_section3: imgSection3,
  deployment_pipeline_section4: imgSection4,
  deployment_pipeline_section5: imgSection5,
  deployment_pipeline_section6: imgSection6,
  deployment_pipeline_section7: imgSection7,
};

import {
  DeploymentPipelineFlexContainer,
  DeploymentPipelineSidebar,
  DeploymentPipelineSidebarItem,
  DeploymentPipelineSidebarItemIcon,
  DeploymentPipelineSidebarItemLabel,
  DeploymentPipelinePanel,
  DeploymentPipelineSection,
  DeploymentPipelineSectionTitle,
  DeploymentPipelineVisualBlock,
  DeploymentPipelineVisualImageFrame,
  DeploymentPipelineVisualImage,
  DeploymentPipelineVisualCaption,
  DeploymentPipelineVisualTypeLabel,
  DeploymentPipelineVisualDescription,
  DeploymentPipelineFeatureGrid,
  DeploymentPipelineFeatureCard,
  DeploymentPipelineFeatureTitle,
  DeploymentPipelineFeatureDescription,
  DeploymentPipelineHeaderBlock,
  DeploymentPipelineTitle,
} from './DeploymentPipeline.styles';

import { DeploymentStepIcons } from '@assets/icons/products/PipelineStepIcons';

const LUCIDE_STYLE = { width: 18, height: 18, strokeWidth: 1.5, 'aria-hidden': true } as const;

const LucidePipelineFallback: Record<string, React.FC> = {
  architecture: (props: React.SVGProps<SVGSVGElement>) => <CloudCogLucide {...LUCIDE_STYLE} {...props} />,
  provisioning: (props: React.SVGProps<SVGSVGElement>) => <KeyRoundLucide {...LUCIDE_STYLE} {...props} />,
  serving: (props: React.SVGProps<SVGSVGElement>) => <ServerLucide {...LUCIDE_STYLE} {...props} />,
  performance: (props: React.SVGProps<SVGSVGElement>) => <GaugeLucide {...LUCIDE_STYLE} {...props} />,
  monitoring: (props: React.SVGProps<SVGSVGElement>) => <ActivityLucide {...LUCIDE_STYLE} {...props} />,
  governance: (props: React.SVGProps<SVGSVGElement>) => <FileCheckLucide {...LUCIDE_STYLE} {...props} />,
  support: (props: React.SVGProps<SVGSVGElement>) => <HeadphonesLucide {...LUCIDE_STYLE} {...props} />,
};

const resolveStepIcon = (id: string): React.FC | undefined =>
  DeploymentStepIcons[id] ?? LucidePipelineFallback[id];

interface Feature {
  title: string;
  description: string;
}

interface SectionData {
  id: string;
  sidebarLabel: string;
  title: string;
  visual: {
    type: string;
    description: string;
    image?: string;
  };
  features: Feature[];
}

const sections: SectionData[] = [
  section1 as SectionData,
  section2 as SectionData,
  section3 as SectionData,
  section4 as SectionData,
  section5 as SectionData,
  section6 as SectionData,
  section7 as SectionData,
];

const resolveVisualImage = (imageKey?: string): string | undefined => {
  if (!imageKey) return undefined;
  const base = imageKey.replace(/\.png$/i, '');
  return imageMapping[base];
};

export function DeploymentPipeline() {
  const theme = useTheme();
  const { setHeaderTheme } = useUiStore();
  const [activeId, setActiveId] = useState(sections[0].id);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    setHeaderTheme('light');
  }, [setHeaderTheme]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section-id');
            if (id) setActiveId(id);
          }
        }
      },
      { threshold: 0.2, rootMargin: '-120px 0px -60% 0px' }
    );

    for (const ref of sectionRefs.current.values()) {
      observer.observe(ref);
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const element = sectionRefs.current.get(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Section
      paddingYTop="none"
      paddingYBottom="lg"
      background={theme.colors.background.secondary}
    >
      <Container variant="wide">
        <DeploymentPipelineHeaderBlock
          as={motion.div}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <DeploymentPipelineTitle>The AI Deployment Pipeline</DeploymentPipelineTitle>
        </DeploymentPipelineHeaderBlock>

        <DeploymentPipelineFlexContainer>
          <DeploymentPipelineSidebar>
            {sections.map((section) => {
              const StepIcon = resolveStepIcon(section.id);
              const isActive = section.id === activeId;
              return (
                <DeploymentPipelineSidebarItem
                  key={section.id}
                  $active={isActive}
                  onClick={() => scrollTo(section.id)}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {StepIcon && (
                    <DeploymentPipelineSidebarItemIcon $active={isActive}>
                      <StepIcon />
                    </DeploymentPipelineSidebarItemIcon>
                  )}
                  <DeploymentPipelineSidebarItemLabel>{section.sidebarLabel}</DeploymentPipelineSidebarItemLabel>
                </DeploymentPipelineSidebarItem>
              );
            })}
          </DeploymentPipelineSidebar>

          <DeploymentPipelinePanel>
            {sections.map((section) => {
              const imageSrc = resolveVisualImage(section.visual.image);
              return (
                <DeploymentPipelineSection
                  key={section.id}
                  id={`neryva-deployment-pipeline-${section.id}`}
                  data-section-id={section.id}
                  ref={(el: HTMLElement | null) => {
                    if (el) sectionRefs.current.set(section.id, el);
                    else sectionRefs.current.delete(section.id);
                  }}
                  as={motion.section}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <DeploymentPipelineSectionTitle>{section.title}</DeploymentPipelineSectionTitle>

                  <DeploymentPipelineVisualBlock>
                    {imageSrc ? (
                      <DeploymentPipelineVisualImageFrame>
                        <DeploymentPipelineVisualImage
                          src={imageSrc}
                          alt={section.visual.description}
                          as={motion.img}
                          initial={{ opacity: 0, scale: 1.05 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.8 }}
                        />
                      </DeploymentPipelineVisualImageFrame>
                    ) : (
                      <DeploymentPipelineVisualCaption>
                        <DeploymentPipelineVisualTypeLabel>{section.visual.type}</DeploymentPipelineVisualTypeLabel>
                        <DeploymentPipelineVisualDescription>{section.visual.description}</DeploymentPipelineVisualDescription>
                      </DeploymentPipelineVisualCaption>
                    )}
                  </DeploymentPipelineVisualBlock>

                  <DeploymentPipelineFeatureGrid>
                    {section.features.map((feature, featureIndex) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.5,
                          ease: [0.16, 1, 0.3, 1],
                          delay: featureIndex * 0.1,
                        }}
                      >
                        <DeploymentPipelineFeatureCard>
                          <DeploymentPipelineFeatureTitle>{feature.title}</DeploymentPipelineFeatureTitle>
                          <DeploymentPipelineFeatureDescription>{feature.description}</DeploymentPipelineFeatureDescription>
                        </DeploymentPipelineFeatureCard>
                      </motion.div>
                    ))}
                  </DeploymentPipelineFeatureGrid>
                </DeploymentPipelineSection>
              );
            })}
          </DeploymentPipelinePanel>
        </DeploymentPipelineFlexContainer>
      </Container>
    </Section>
  );
}
