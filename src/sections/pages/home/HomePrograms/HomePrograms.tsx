import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TextLink } from '@/components/common/ui/TextLink';
import homeProgramsData from '@data/pages/home/home_programs.json';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { theme } from '@/styles/theme';
import {
  LLMIcon,
  RoboticsIcon,
  ClinicalIcon,
  EnergyIcon,
  SidebarLLMIcon,
  SidebarRoboticsIcon,
  SidebarClinicalIcon,
  SidebarEnergyIcon
} from '@assets/visual/home/programs';
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
  ProgramCTA,
  ProgramDescription,
  ProgramVisual,
  VisualOverlay,
  VisualCaption,
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

type ProgramId = 'large-language-models' | 'robotics-task-transfer' | 'clinical-ai' | 'energy-engineering-optimization';

const ProgramIcons: Record<ProgramId, React.FC<{ accent: string }>> = {
  'large-language-models': LLMIcon,
  'robotics-task-transfer': RoboticsIcon,
  'clinical-ai': ClinicalIcon,
  'energy-engineering-optimization': EnergyIcon,
};

const SidebarIconsMap: Record<ProgramId, React.FC> = {
  'large-language-models': SidebarLLMIcon,
  'robotics-task-transfer': SidebarRoboticsIcon,
  'clinical-ai': SidebarClinicalIcon,
  'energy-engineering-optimization': SidebarEnergyIcon,
};

export function HomePrograms() {
  const { heading, programs, footer } = homeProgramsData;
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
        rootMargin: '-20% 0px -40% 0px',
        threshold: 0.5,
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
              const SidebarIcon = SidebarIconsMap[program.id as ProgramId];
              const isActive = activeId === program.id;

              return (
                <MenuItem
                  key={`menu-${program.id}`}
                  $active={isActive}
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
              const IconComponent = ProgramIcons[program.id as ProgramId];
              return (
                <ProgramRow
                  key={program.id}
                  id={program.id}
                  ref={(el) => (rowRefs.current[program.id] = el)}
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
                    <ProgramCTA as={motion.div} variants={fadeUp}>
                      <TextLink to="/research">
                        Discover {program.title.split(' ')[0]}
                      </TextLink>
                    </ProgramCTA>
                  </ProgramHeader>

                  <motion.div variants={fadeUp}>
                    <ProgramDescription>{program.description}</ProgramDescription>
                  </motion.div>

                  <ProgramVisual
                    $accent={program.accent}
                    as={motion.div}
                    variants={fadeUp}
                  >
                    <VisualOverlay />
                    {IconComponent && <IconComponent accent="#FFFFFF" />}
                    <VisualCaption>
                      PROGRAM {program.number.toString().padStart(2, '0')} • {program.title.toUpperCase()}
                    </VisualCaption>
                  </ProgramVisual>
                </ProgramRow>
              );
            })}
          </ProgramsContent>
        </TwoColumnLayout>

        {/* Footer CTA */}
        <FooterAction
          as={motion.div}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <TextLink to={footer.linkUrl}>
            {footer.linkText}
          </TextLink>
        </FooterAction>
      </Container>
    </Section>
  );
}
