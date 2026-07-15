import { useRef, useEffect, useState } from 'react';
import { useTheme } from 'styled-components';
import { motion } from 'framer-motion';

// Data imports
import programAreas from '@neryva_data/research/sections/program_areas.json';

// Common layout & components
import { Container } from '@/sections/common/layout/Container';
import { PixelArrow } from '@/components/common/PixelArrow';
import { ModelMotif } from '@/components/common/ModelMotifs';
import { Section } from '@/sections/common/layout/Section';

// Styled components
import {
  FlexContainer,
  Sidebar,
  SidebarItem,
  Panel,
  ProgramSection,
  ProgramTitle,
  CardGrid,
  GridCell,
  Card,
  CardHeader,
  MotifBox,
  OpenBadge,
  CardBody,
  CardTitle,
  CardDescription,
  TagRow,
  Tag,
} from './ResearchAreas.styles';

// Type definitions
type ProgramId = keyof typeof programAreas;
const programIds = Object.keys(programAreas) as ProgramId[];

export function ResearchAreas() {
  const theme = useTheme();
  const [activeId, setActiveId] = useState<ProgramId>(programIds[0] || 'large-language-models');
  const sectionRefs = useRef<Map<ProgramId, HTMLElement>>(new Map());

  // Intersection Observer to drive the Sticky Navigation state
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-program-id') as ProgramId;
            if (id) setActiveId(id);
          }
        }
      },
      // Offset precisely accounts for the 120px sticky top spacing defined in styles
      { threshold: 0.2, rootMargin: '-120px 0px -60% 0px' },
    );

    for (const ref of sectionRefs.current.values()) {
      observer.observe(ref);
    }

    return () => observer.disconnect();
  }, []);

  // Smooth scroll handler for sidebar clicks
  const scrollTo = (id: ProgramId) => {
    const element = sectionRefs.current.get(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Section
      paddingYTop="md"
      paddingYBottom="lg"
      background={theme.colors.background.secondary} // Provides contrast for the white grid cells
    >
      <Container>
        <FlexContainer>

          {/* LEFT: STICKY NAVIGATION */}
          <Sidebar>
            {programIds.map((id) => {
              const program = programAreas[id];
              const isActive = id === activeId;

              return (
                <SidebarItem
                  key={id}
                  $active={isActive}
                  $accent={program.accent}
                  onClick={() => scrollTo(id)}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {program.title}
                  {isActive && <PixelArrow size={12} />}
                </SidebarItem>
              );
            })}
          </Sidebar>

          {/* RIGHT: SCROLLING MASTER GRID */}
          <Panel>
            {programIds.map((id) => {
              const program = programAreas[id];

              return (
                <ProgramSection
                  key={id}
                  id={`research-program-${id}`}
                  data-program-id={id}
                  ref={(el: HTMLElement | null) => {
                    if (el) sectionRefs.current.set(id, el);
                    else sectionRefs.current.delete(id);
                  }}
                  as={motion.section}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  // Premium Apple-like easing curve
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
                >

                  {/* Title Area */}
                  <ProgramTitle $accent={program.accent}>
                    {program.title}
                  </ProgramTitle>

                  {/* Card Grid Area */}
                  <CardGrid>
                    {program.cards.map((card, index) => (
                      <GridCell
                        key={card.id}
                        as={motion.div}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.5,
                          ease: [0.16, 1, 0.3, 1] as const,
                          delay: index * 0.1, // Elegant staggered entrance
                        }}
                      >
                        <Card>
                          <CardHeader>
                            <MotifBox>
                              <ModelMotif programId={id} size={22} color={program.accent} />
                            </MotifBox>
                            <OpenBadge>OPEN</OpenBadge>
                          </CardHeader>

                          <CardBody>
                            <CardTitle>{card.title}</CardTitle>
                            <CardDescription>{card.description}</CardDescription>

                            {/* Refined Tag Row stays firmly anchored at the bottom */}
                            <TagRow>
                              {card.labels.map((label) => (
                                <Tag key={label}>{label}</Tag>
                              ))}
                            </TagRow>
                          </CardBody>
                        </Card>
                      </GridCell>
                    ))}
                  </CardGrid>

                </ProgramSection>
              );
            })}
          </Panel>

        </FlexContainer>
      </Container>
    </Section>
  );
}