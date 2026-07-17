import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Network,
  FileLock2,
  Activity,
  FileText,
  ScanLine,
  Cpu,
  Wrench,
  Layers
} from 'lucide-react';
import industryData from '@neryva_data/solutions/industries.json';
import {
  Wrapper,
  InnerContainer,
  HeaderBlock,
  Title,
  Desc,
  OSDashboard,
  Sidebar,
  MenuItem,
  MenuPrefix,
  MenuLabel,
  ActiveIndicator,
  Stage,
  StageBento,
  BentoCell,
  AppIcon,
  AppTitle,
  AppDesc
} from './SolutionsIndustries.styles';

// Dynamic icon directory mapped for bulletproof imports
const IconsMap: Record<string, any> = {
  ShieldCheck, Network, FileLock2,
  Activity, FileText, ScanLine,
  Cpu, Wrench, Layers
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
      delay: custom * 0.08
    }
  }),
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

export function SolutionsIndustries() {
  const { header, industries } = industryData;
  const [activeId, setActiveId] = useState(industries[0].id);

  // Memoize active dataset for instantaneous retrieval
  const activeIndustry = industries.find((i) => i.id === activeId) || industries[0];

  return (
    <Wrapper>
      <InnerContainer>

        {/* ── HEADER INTRO ── */}
        <HeaderBlock
          as={motion.div}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <Title>{header.title}</Title>
          <Desc>{header.description}</Desc>
        </HeaderBlock>

        {/* ── THE COMMAND INTERFACE ── */}
        <OSDashboard>

          {/* 1. INTERACTIVE LEFT SIDEBAR */}
          <Sidebar>
            {industries.map((ind) => (
              <MenuItem
                key={ind.id}
                $isActive={activeId === ind.id}
                onClick={() => setActiveId(ind.id)}
              >
                {/* 
                  Magic Layout ID line tracker. It fluidly slides between buttons. 
                */}
                {activeId === ind.id && (
                  <ActiveIndicator
                    as={motion.div}
                    layoutId="neryva-industry-indicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <MenuPrefix>// {ind.prefix}</MenuPrefix>
                <MenuLabel>{ind.name}</MenuLabel>
              </MenuItem>
            ))}
          </Sidebar>

          {/* 2. DYNAMIC RIGHT STAGE (Morphing Payload Window) */}
          <Stage>
            {/* 
              AnimatePresence 'mode="wait"' ensures the exiting Bento fully leaves 
              the screen before the newly clicked industry loads into the window. 
            */}
            <AnimatePresence mode="wait">
              <StageBento
                as={motion.div}
                key={activeIndustry.id}
              >
                {activeIndustry.applications.map((app, index) => {
                  const LucideIcon = IconsMap[app.icon];

                  return (
                    <BentoCell
                      key={app.title}
                      $span={app.span}
                      as={motion.div}
                      variants={fadeUp}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <AppIcon>
                        {LucideIcon && <LucideIcon />}
                      </AppIcon>
                      <AppTitle>{app.title}</AppTitle>
                      <AppDesc>{app.description}</AppDesc>
                    </BentoCell>
                  );
                })}
              </StageBento>
            </AnimatePresence>
          </Stage>

        </OSDashboard>

      </InnerContainer>
    </Wrapper>
  );
}