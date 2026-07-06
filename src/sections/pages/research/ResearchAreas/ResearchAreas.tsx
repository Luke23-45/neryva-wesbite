import { useRef, useEffect, useState } from 'react';
import { useTheme } from 'styled-components';
import { motion } from 'framer-motion';
import programAreas from '@data/research/program-areas.json';
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

type ProgramId = keyof typeof programAreas;

const programIds = Object.keys(programAreas) as ProgramId[];

const sectionId = (id: ProgramId) => `research-program-${id}`;

export function ResearchAreas() {
  const theme = useTheme();
  const [active, setActive] = useState<ProgramId>('large-language-models');
  const sectionRefs = useRef<Map<ProgramId, HTMLElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-program-id') as ProgramId;
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

  const scrollTo = (id: ProgramId) => {
    const el = sectionRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Section paddingYTop="md" paddingYBottom="none" background={theme.colors.background.secondary}>
      <Container>
        <FlexContainer>
          <Sidebar>
            {programIds.map((id) => {
              const p = programAreas[id];
              return (
                <SidebarItem
                  key={id}
                  $active={id === active}
                  $accent={p.accent}
                  onClick={() => scrollTo(id)}
                >
                  {p.title}
                  {id === active && <PixelArrow size={14} />}
                </SidebarItem>
              );
            })}
          </Sidebar>

          <Panel>
            {programIds.map((id) => {
              const p = programAreas[id];
              return (
                <ProgramSection
                  key={id}
                  id={sectionId(id)}
                  data-program-id={id}
                  ref={(el: HTMLElement | null) => {
                    if (el) sectionRefs.current.set(id, el);
                    else sectionRefs.current.delete(id);
                  }}
                  as={motion.section}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] as const }}
                >
                  <ProgramTitle $accent={p.accent}>{p.title}</ProgramTitle>
                  <CardGrid>
                    {p.cards.map((card, i) => (
                      <GridCell key={card.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] as const, delay: i * 0.06 }}
                          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                        >
                          <Card>
                            <CardHeader>
                              <MotifBox>
                                <ModelMotif programId={id} size={20} color={p.accent} />
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
                          </Card>
                        </motion.div>
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
