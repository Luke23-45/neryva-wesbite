import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import programsData from '@neryva_data/home/sections/research_overview.json';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { theme } from '@/styles/theme';

import {
  HeaderSection,
  SectionTitle,
  TwoColumnLayout,
  SidebarMenu,
  MenuItem,
  ProgramsContent,
  ProgramRow,
  ProgramHeader,
  ProgramTitle,
  ProgramBody,
  ProgramDescription,
  ProgramVisual,
  FooterAction,
} from './HomePrograms.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

import { NavMotifIcon } from '@/assets/visual/navigation/NavMotifs';

const ProgramIcons: Record<string, React.FC> = {
  'language-systems': () => <NavMotifIcon kind="llm" />,
  'robotics-task-transfer': () => <NavMotifIcon kind="robotics" />,
  'biomedical-biological-clinical-ai': () => <NavMotifIcon kind="clinical" />,
  'energy-systems': () => <NavMotifIcon kind="energy" />,
  'computational-science-engineering': () => <NavMotifIcon kind="deployment" />,
};

const SidebarIconsMap: Record<string, React.FC> = {
  'language-systems': () => <NavMotifIcon kind="llm" />,
  'robotics-task-transfer': () => <NavMotifIcon kind="robotics" />,
  'biomedical-biological-clinical-ai': () => <NavMotifIcon kind="clinical" />,
  'energy-systems': () => <NavMotifIcon kind="energy" />,
  'computational-science-engineering': () => <NavMotifIcon kind="deployment" />,
};

import imgLanguage from '@assets/page/home/language_systems.png';
import imgRobotics from '@assets/page/home/robotics_task_transfer.png';
import imgBiomedical from '@assets/page/home/biomedical_ai.png';
import imgEnergy from '@assets/page/home/energy_systems.png';
import imgComputational from '@assets/page/home/computational_science_1784559569500.png';

const ProgramImagesMap: Record<string, string> = {
  'language-systems': imgLanguage,
  'robotics-task-transfer': imgRobotics,
  'biomedical-biological-clinical-ai': imgBiomedical,
  'energy-systems': imgEnergy,
  'computational-science-engineering': imgComputational,
};

const programAccents: Record<string, string> = {
  'language-systems': '#2458D3',
  'robotics-task-transfer': '#0B7F79',
  'biomedical-biological-clinical-ai': '#1F7A4D',
  'energy-systems': '#D99100',
  'computational-science-engineering': '#8E44AD',
};

export function HomePrograms() {
  const { heading, programs, footer } = {
    heading: { label: programsData.label, title: programsData.title },
    programs: programsData.items.map((item: any, i: number) => ({
      id: item.id,
      slug: item.id,
      number: i + 1,
      accent: programAccents[item.id] || '#2458D3',
      title: item.title,
      description: item.description,
    })),
    footer: { linkText: programsData.cta?.label || '', linkUrl: programsData.cta?.href || '' },
  };
  const [activeId, setActiveId] = useState<string>(programs[0].id);

  // References to the program row elements
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If a program row intersects at least 50% with the viewport, mark it as active
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-30% 0px -60% 0px', // Creates a narrow intersection band
        threshold: 0, // Ensures even very tall elements trigger when they cross the band
      }
    );

    Object.values(rowRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToProgram = (id: string) => {
    const el = rowRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Section paddingYTop="lg" paddingYBottom="none" background={theme.colors.background.primary}>
      <Container>
        {/* Header */}
        <HeaderSection
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >

          <motion.div variants={fadeUp}>
            <SectionTitle>{heading.title}</SectionTitle>
          </motion.div>
        </HeaderSection>

        {/* Two Column Layout */}
        <TwoColumnLayout>
          {/* Left Column: Sticky Sidebar Menu */}
          <SidebarMenu>
            {programs.map((program) => {
              const SidebarIcon = SidebarIconsMap[program.id];
              const isActive = activeId === program.id;

              return (
                <MenuItem
                  key={`menu-${program.id}`}
                  $active={isActive}
                  $accent={program.accent}
                  onClick={() => scrollToProgram(program.id)}
                  aria-label={`Scroll to ${program.title}`}
                >
                  {SidebarIcon && <SidebarIcon />}
                </MenuItem>
              );
            })}
          </SidebarMenu>

          {/* Right Column: Program Rows */}
          <ProgramsContent>
            {programs.map((program) => {
              const IconComponent = ProgramIcons[program.id];
              return (
                <ProgramRow
                  key={program.id}
                  id={program.id}
                  ref={(el) => { rowRefs.current[program.id] = el; }}
                  as={motion.div}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-100px' }}
                  variants={staggerContainer}
                >
                  <ProgramHeader>
                    <motion.div variants={fadeUp}>
                      <ProgramTitle $accent={program.accent}>{program.title}</ProgramTitle>
                    </motion.div>
                  </ProgramHeader>

                  <ProgramBody>
                    <motion.div variants={fadeUp}>
                      <ProgramDescription>{program.description}</ProgramDescription>
                    </motion.div>

                    <ProgramVisual
                      $accent={program.accent}
                      as={motion.div}
                      variants={fadeUp}
                    >
                      {ProgramImagesMap[program.id] ? (
                        <img 
                          src={ProgramImagesMap[program.id]} 
                          alt={program.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        IconComponent && <IconComponent accent="#FFFFFF" />
                      )}
                    </ProgramVisual>
                  </ProgramBody>
                </ProgramRow>
              );
            })}
          </ProgramsContent>
        </TwoColumnLayout>
      </Container>
    </Section>
  );
}
