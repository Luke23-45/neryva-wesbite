import { useRef, useEffect, useState } from 'react';
import { useTheme } from 'styled-components';
import { motion } from 'framer-motion';
import { useUiStore } from '@store/uiStore';
import { Container } from '@/sections/common/layout/Container';
import { Section } from '@/sections/common/layout/Section';
import section2 from '@neryva_data/products/ai_enterprised/section2.json';
import section3 from '@neryva_data/products/ai_enterprised/section3.json';
import section4 from '@neryva_data/products/ai_enterprised/section4.json';
import section5 from '@neryva_data/products/ai_enterprised/section5.json';
import section6 from '@neryva_data/products/ai_enterprised/section6.json';
import {
  FlexContainer,
  Sidebar,
  SidebarItem,
  Panel,
  PipelineSectionStyled,
  SectionTitle,
  VisualBlock,
  VisualTypeLabel,
  VisualDescription,
  FeatureGrid,
  FeatureCard,
  FeatureTitle,
  FeatureDescription,
  SectionDivider,
} from './EnterprisePipeline.styles';

interface SectionData {
  id: string;
  sidebarLabel: string;
  title: string;
  visual: {
    type: string;
    description: string;
  };
  features: Array<{
    title: string;
    description: string;
  }>;
}

const sections: SectionData[] = [
  section2 as SectionData,
  section3 as SectionData,
  section4 as SectionData,
  section5 as SectionData,
  section6 as SectionData,
];

export function EnterprisePipeline() {
  const theme = useTheme();
  const { setHeaderTheme } = useUiStore();
  const [active, setActive] = useState(sections[0].id);
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
            if (id) setActive(id);
          }
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' },
    );

    for (const ref of sectionRefs.current.values()) {
      observer.observe(ref);
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = sectionRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Section
      paddingYTop="none"
      paddingYBottom="md"
      background={theme.colors.background.secondary}
    >
      <Container variant="wide">
        <FlexContainer>
          <Sidebar>
            {sections.map((s) => (
              <SidebarItem
                key={s.id}
                $active={s.id === active}
                onClick={() => scrollTo(s.id)}
              >
                {s.sidebarLabel}
              </SidebarItem>
            ))}
          </Sidebar>

          <Panel>
            {sections.map((s, sectionIdx) => (
              <motion.div key={s.id}>
                {sectionIdx > 0 && <SectionDivider />}

                <PipelineSectionStyled
                  id={`enterprise-pipeline-${s.id}`}
                  data-section-id={s.id}
                  ref={(el: HTMLElement | null) => {
                    if (el) sectionRefs.current.set(s.id, el);
                    else sectionRefs.current.delete(s.id);
                  }}
                  as={motion.section}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] as const }}
                >
                  <SectionTitle>{s.title}</SectionTitle>

                  <VisualBlock>
                    <VisualTypeLabel>{s.visual.type}</VisualTypeLabel>
                    <VisualDescription>{s.visual.description}</VisualDescription>
                  </VisualBlock>

                  <FeatureGrid>
                    {s.features.map((f, featIdx) => (
                      <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.4,
                          ease: [0.2, 0, 0, 1] as const,
                          delay: featIdx * 0.06,
                        }}
                        style={{ display: 'flex', flexDirection: 'column' }}
                      >
                        <FeatureCard>
                          <FeatureTitle>{f.title}</FeatureTitle>
                          <FeatureDescription>{f.description}</FeatureDescription>
                        </FeatureCard>
                      </motion.div>
                    ))}
                  </FeatureGrid>
                </PipelineSectionStyled>
              </motion.div>
            ))}
          </Panel>
        </FlexContainer>
      </Container>
    </Section>
  );
}
