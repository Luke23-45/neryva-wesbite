import { useRef, useEffect, useState } from 'react';
import { useTheme } from 'styled-components';
import { motion } from 'framer-motion';
import { useUiStore } from '@store/uiStore';
import { Container } from '@/sections/common/layout/Container';
import { Section } from '@/sections/common/layout/Section';

// Importing the newly mapped 6-stage Neryva Agent Studio data
import section2 from '@neryva_data/products/ai_enterprised/section2.json';
import section3 from '@neryva_data/products/ai_enterprised/section3.json';
import section4 from '@neryva_data/products/ai_enterprised/section4.json';
import section5 from '@neryva_data/products/ai_enterprised/section5.json';
import section6 from '@neryva_data/products/ai_enterprised/section6.json';
import section7 from '@neryva_data/products/ai_enterprised/section7.json';

// Import images statically
import imgPipelineSection2 from '@assets/page/product/enterprised_ai/pipeline_section2.png';
import imgPipelineSection3 from '@assets/page/product/enterprised_ai/pipeline_section3.png';
import imgPipelineSection4 from '@assets/page/product/enterprised_ai/pipeline_section4.png';
import imgPipelineSection5 from '@assets/page/product/enterprised_ai/pipeline_section5.png';
import imgPipelineSection6 from '@assets/page/product/enterprised_ai/pipeline_section6.png';
import imgPipelineSection7 from '@assets/page/product/enterprised_ai/pipeline_section7.png';

const imageMapping: Record<string, string> = {
  'pipeline_section2.png': imgPipelineSection2,
  'pipeline_section3.png': imgPipelineSection3,
  'pipeline_section4.png': imgPipelineSection4,
  'pipeline_section5.png': imgPipelineSection5,
  'pipeline_section6.png': imgPipelineSection6,
  'pipeline_section7.png': imgPipelineSection7,
};

import {
  FlexContainer,
  Sidebar,
  SidebarItem,
  SidebarItemIcon,
  SidebarItemLabel,
  Panel,
  PipelineSectionStyled,
  SectionTitle,
  VisualBlock,
  VisualImageFrame,
  VisualImage,
  VisualCaption,
  VisualTypeLabel,
  VisualDescription,
  FeatureGrid,
  FeatureCard,
  FeatureTitle,
  FeatureDescription,
  HeaderBlock,
  PipelineTitle,
} from './EnterprisePipeline.styles';

import { EnterpriseStepIcons } from '@assets/icons/products/PipelineStepIcons';

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
  section2 as SectionData,
  section3 as SectionData,
  section4 as SectionData,
  section5 as SectionData,
  section6 as SectionData,
  section7 as SectionData,
];

export function EnterprisePipeline() {
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

  // Strip leading "N. " index prefix (e.g. "1. Business scope" -> "Business scope")
  // so the sidebar reads alongside the new premium step icons.
  const stripStepPrefix = (label: string) => label.replace(/^\s*\d+\.\s*/, '');

  return (
    <Section
      paddingYTop="none"
      paddingYBottom="lg"
      background={theme.colors.background.secondary} // Soft grey background to make the white grid pop
    >
      <Container variant="wide">
        <HeaderBlock
          as={motion.div}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}

        >
          <PipelineTitle>The AI Enterprise Pipeline</PipelineTitle>
        </HeaderBlock>

        <FlexContainer>
          {/* LEFT: STICKY NAV */}
          <Sidebar>
            {sections.map((section) => {
              const StepIcon = EnterpriseStepIcons[section.id];
              const isActive = section.id === activeId;
              return (
                <SidebarItem
                  key={section.id}
                  $active={isActive}
                  onClick={() => scrollTo(section.id)}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {StepIcon && (
                    <SidebarItemIcon $active={isActive}>
                      <StepIcon />
                    </SidebarItemIcon>
                  )}
                  <SidebarItemLabel>{stripStepPrefix(section.sidebarLabel)}</SidebarItemLabel>
                </SidebarItem>
              );
            })}
          </Sidebar>

          {/* RIGHT: SCROLLING CONTENT GRID */}
          <Panel>
            {sections.map((section) => (
              <PipelineSectionStyled
                key={section.id}
                id={`neryva-pipeline-${section.id}`}
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
                  {section.visual.image && imageMapping[section.visual.image] ? (
                    <VisualImageFrame>
                      <VisualImage
                        src={imageMapping[section.visual.image]}
                        alt={section.visual.description}
                        as={motion.img}
                        initial={{ opacity: 0, scale: 1.05 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                      />
                    </VisualImageFrame>
                  ) : (
                    <VisualCaption>
                      <VisualTypeLabel>{section.visual.type}</VisualTypeLabel>
                      <VisualDescription>{section.visual.description}</VisualDescription>
                    </VisualCaption>
                  )}
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
    </Section >
  );
}