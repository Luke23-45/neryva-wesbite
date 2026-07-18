import { useRef, useEffect, useState } from 'react';
import { useTheme } from 'styled-components';
import { motion } from 'framer-motion';
import { useUiStore } from '@store/uiStore';
import { Container } from '@/sections/common/layout/Container';
import { Section } from '@/sections/common/layout/Section';

// Importing the newly mapped 7-stage Neryva AI Deployment data
import section1 from '@neryva_data/products/deployment/section1.json';
import section2 from '@neryva_data/products/deployment/section2.json';
import section3 from '@neryva_data/products/deployment/section3.json';
import section4 from '@neryva_data/products/deployment/section4.json';
import section5 from '@neryva_data/products/deployment/section5.json';
import section6 from '@neryva_data/products/deployment/section6.json';
import section7 from '@neryva_data/products/deployment/section7.json';

// Import images statically
import imgDeploymentSection1 from '@assets/images/page/deployment/deployment_pipeline_section1.png';
import imgDeploymentSection2 from '@assets/images/page/deployment/deployment_pipeline_section2.png';
import imgDeploymentSection3 from '@assets/images/page/deployment/deployment_pipeline_section3.png';
import imgDeploymentSection4 from '@assets/images/page/deployment/deployment_pipeline_section4.png';
import imgDeploymentSection5 from '@assets/images/page/deployment/deployment_pipeline_section5.png';
import imgDeploymentSection6 from '@assets/images/page/deployment/deployment_pipeline_section6.png';
import imgDeploymentSection7 from '@assets/images/page/deployment/deployment_pipeline_section7.png';

const imageMapping: Record<string, string> = {
  'deployment_pipeline_section1.png': imgDeploymentSection1,
  'deployment_pipeline_section2.png': imgDeploymentSection2,
  'deployment_pipeline_section3.png': imgDeploymentSection3,
  'deployment_pipeline_section4.png': imgDeploymentSection4,
  'deployment_pipeline_section5.png': imgDeploymentSection5,
  'deployment_pipeline_section6.png': imgDeploymentSection6,
  'deployment_pipeline_section7.png': imgDeploymentSection7,
};

import {
  FlexContainer,
  Sidebar,
  SidebarItem,
  Panel,
  PipelineSectionStyled,
  SectionTitle,
  VisualBlock,
  VisualImage,
  VisualTypeLabel,
  VisualDescription,
  FeatureGrid,
  FeatureCard,
  FeatureTitle,
  FeatureDescription,
} from './DeploymentPipeline.styles';

// Strict typing for our data schema
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

// Consolidating our JSON imports into the pipeline array
const sections: SectionData[] = [
  section1 as SectionData,
  section2 as SectionData,
  section3 as SectionData,
  section4 as SectionData,
  section5 as SectionData,
  section6 as SectionData,
  section7 as SectionData,
];

export function DeploymentPipeline() {
  const theme = useTheme();
  const { setHeaderTheme } = useUiStore();
  const [activeId, setActiveId] = useState(sections[0].id);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Force light theme for this clean, structural design
  useEffect(() => {
    setHeaderTheme('light');
  }, [setHeaderTheme]);

  // Intersection Observer to drive the Sticky Navigation state
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
      // Offset accounts for the 120px sticky top spacing to trigger accurately
      { threshold: 0.2, rootMargin: '-120px 0px -60% 0px' }
    );

    for (const ref of sectionRefs.current.values()) {
      observer.observe(ref);
    }

    return () => observer.disconnect();
  }, []);

  // Smooth scroll handler for sidebar clicks
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
      background={theme.colors.background.secondary} // Soft grey background to make the white grid pop
    >
      <Container variant="wide">
        <FlexContainer>
          {/* LEFT: STICKY NAV */}
          <Sidebar>
            {sections.map((section) => (
              <SidebarItem
                key={section.id}
                $active={section.id === activeId}
                onClick={() => scrollTo(section.id)}
                aria-current={section.id === activeId ? 'step' : undefined}
              >
                {section.sidebarLabel}
              </SidebarItem>
            ))}
          </Sidebar>

          {/* RIGHT: SCROLLING CONTENT GRID */}
          <Panel>
            {sections.map((section) => (
              <PipelineSectionStyled
                key={section.id}
                id={`deployment-pipeline-${section.id}`}
                data-section-id={section.id}
                ref={(el: HTMLElement | null) => {
                  if (el) sectionRefs.current.set(section.id, el);
                  else sectionRefs.current.delete(section.id);
                }}
                as={motion.section}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // Apple-esque spring-like ease
              >
                {/* Row 1: Strict Header */}
                <SectionTitle>{section.title}</SectionTitle>

                {/* Row 2: Visual Diagram Area */}
                <VisualBlock>
                  {section.visual.image && imageMapping[section.visual.image] && (
                    <VisualImage 
                      src={imageMapping[section.visual.image]} 
                      alt={section.visual.description}
                      as={motion.img}
                      initial={{ opacity: 0, scale: 1.05 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8 }}
                    />
                  )}
                  <VisualTypeLabel>{section.visual.type}</VisualTypeLabel>
                  <VisualDescription>{section.visual.description}</VisualDescription>
                </VisualBlock>

                {/* Row 3: 3-Column Feature Grid */}
                <FeatureGrid>
                  {section.features.map((feature, featureIndex) => (
                    // This motion.div acts as the direct column wrapper targeted by our > div CSS
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        ease: [0.16, 1, 0.3, 1],
                        delay: featureIndex * 0.1, // Staggered fade in
                      }}
                    >
                      <FeatureCard>
                        <FeatureTitle>{feature.title}</FeatureTitle>
                        <FeatureDescription>{feature.description}</FeatureDescription>
                      </FeatureCard>
                    </motion.div>
                  ))}
                </FeatureGrid>
              </PipelineSectionStyled>
            ))}
          </Panel>
        </FlexContainer>
      </Container>
    </Section>
  );
}
