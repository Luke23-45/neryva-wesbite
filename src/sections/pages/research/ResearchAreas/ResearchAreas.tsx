import { useRef, useEffect, useState } from 'react';
import { useTheme } from 'styled-components';
import { motion } from 'framer-motion';

import programAreas from '@neryva_data/research/sections/program_areas.json';
import { Container } from '@/sections/common/layout/Container';
import { PixelArrow } from '@/components/common/PixelArrow';
import { ModelMotif } from '@/components/common/ModelMotifs';
import { Section } from '@/sections/common/layout/Section';

import {
  FlexContainer,
  Sidebar,
  SidebarItem,
  Panel,
  ProgramSection,
  ProgramTitle,
  CardGrid,
  GridCell,
  CardHeader,
  MotifBox,
  OpenBadge,
  CardBody,
  CardTitle,
  CardDescription,
  TagRow,
  Tag,
} from './ResearchAreas.styles';

type ProgramId = keyof typeof programAreas;
const programIds = Object.keys(programAreas) as ProgramId[];

export function ResearchAreas() {
  const theme = useTheme();
  const [activeId, setActiveId] = useState<ProgramId>(programIds[0]);
  const sectionRefs = useRef<Map<ProgramId, HTMLElement>>(new Map());

  // Precision alignment tracking matching specific native browser positioning bounds
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
      { threshold: 0.1, rootMargin: '-140px 0px -70% 0px' },
    );

    for (const ref of sectionRefs.current.values()) {
      observer.observe(ref);
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: ProgramId) => {
    const element = sectionRefs.current.get(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Section paddingYTop="md" paddingYBottom="xl" background={theme.colors.background.secondary}>
      <Container variant="wide">
        <FlexContainer>

          {/* ── STICKY SIDEBAR (OS NAVIGATION) ── */}
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

          {/* ── GRID STAGE MATRIX (PURE CELLS) ── */}
          <Panel>
            {programIds.map((id) => {
              const program = programAreas[id];

              // Calculates odd counts automatically rendering pure completion bounds
              const requiresGhostCell = program.cards.length % 2 !== 0;

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
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                >

                  <ProgramTitle $accent={program.accent}>
                    {program.title}
                  </ProgramTitle>

                  <CardGrid data-grid-area>
                    {program.cards.map((card, index) => (
                      <GridCell
                        key={card.id}
                        as={motion.div}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.6,
                          ease: "linear",
                          delay: index * 0.1, // Subtle content entrance staggered
                        }}
                      >
                        <CardHeader>
                          <MotifBox>
                            <ModelMotif programId={id} size={22} color={program.accent} />
                          </MotifBox>
                          <OpenBadge>OPEN</OpenBadge>
                        </CardHeader>

                        <CardBody>
                          <CardTitle>{card.title}</CardTitle>
                          <CardDescription>{card.description}</CardDescription>

                          <TagRow>
                            {card.labels.map((label) => (
                              <Tag key={label}>{label}</Tag>
                            ))}
                          </TagRow>
                        </CardBody>
                      </GridCell>
                    ))}

                    {/* The Unsung Hero fixing lazy HTML rendering: completes the matrix invisibly ensuring lower border spans full table width seamlessly! */}
                    {requiresGhostCell && (
                      <GridCell $isEmpty aria-hidden="true" />
                    )}

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