import { motion } from 'framer-motion';
import { Search, Flame, Box, MessageSquare, Settings, ShieldCheck, Network } from 'lucide-react';
import appsData from '@neryva_data/solutions/applications.json';
import {
  AppsWrapper,
  InnerContainer,
  AppsHeader,
  HeaderIcons,
  AppsTitle,
  AppsDesc,
  AppsGrid,
  AppCell,
  CellIcon,
  CellTitle,
  CellDesc,
} from './SolutionsApplications.styles';

// Dynamic Icon Mapping
const iconMap: Record<string, React.ElementType> = {
  Search,
  Flame,
  Box,
  MessageSquare,
  Settings,
  ShieldCheck,
  Network
};

const premiumEase = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: premiumEase,
      delay: custom * 0.1,
    },
  }),
};

export function SolutionsApplications() {
  return (
    <AppsWrapper>
      <InnerContainer>

        {/* ── HEADER ── */}
        <AppsHeader
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.div variants={fadeUp} custom={0}>
            <HeaderIcons>
              {appsData.header.icons.map((iconName, idx) => {
                const IconComponent = iconMap[iconName];
                return IconComponent ? <IconComponent key={idx} /> : null;
              })}
            </HeaderIcons>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <AppsTitle>{appsData.header.title}</AppsTitle>
          </motion.div>

          <motion.div variants={fadeUp} custom={2}>
            <AppsDesc>{appsData.header.description}</AppsDesc>
          </motion.div>
        </AppsHeader>

        {/* ── MASTER GRID ── */}
        <AppsGrid
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {appsData.items.map((item, i) => {
            const IconComponent = iconMap[item.icon];

            return (
              <AppCell
                key={i}
                as={motion.div}
                variants={fadeUp}
                custom={3 + i}
              >
                <CellIcon>
                  {IconComponent && <IconComponent />}
                </CellIcon>

                <CellTitle>{item.title}</CellTitle>

                {/* The CSS 'margin-top: auto' automatically pushes this to the floor */}
                <CellDesc>{item.description}</CellDesc>
              </AppCell>
            );
          })}
        </AppsGrid>

      </InnerContainer>
    </AppsWrapper>
  );
}