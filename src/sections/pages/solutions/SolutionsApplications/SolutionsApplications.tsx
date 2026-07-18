import { motion } from 'framer-motion';
import { MessageSquare, Settings, ShieldCheck, Network } from 'lucide-react';
import appsData from '@neryva_data/solutions/applications.json';
import {
  AppsWrapper,
  InnerContainer,
  AppsHeader,
  AppsTitle,
  AppsDesc,
  AppsGrid,
  AppCell,
  CellIcon,
  CellTitle,
  CellDesc,
} from './SolutionsApplications.styles';

const iconMap: Record<string, React.ElementType> = {
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
    transition: { duration: 0.8, ease: premiumEase, delay: custom * 0.1 },
  }),
};

export function SolutionsApplications() {
  return (
    <AppsWrapper>
      <InnerContainer>

        {/* ── LEFT-ALIGNED HEADER ── */}
        <AppsHeader
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.div variants={fadeUp} custom={0}>
            <AppsTitle>{appsData.header.title}</AppsTitle>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <AppsDesc>{appsData.header.description}</AppsDesc>
          </motion.div>
        </AppsHeader>

        {/* ── APPLICATION GRID ── */}
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
                custom={2 + i}
              >
                <CellIcon>
                  {IconComponent && <IconComponent />}
                </CellIcon>
                <CellTitle>{item.title}</CellTitle>
                <CellDesc>{item.description}</CellDesc>
              </AppCell>
            );
          })}
        </AppsGrid>

      </InnerContainer>
    </AppsWrapper>
  );
}