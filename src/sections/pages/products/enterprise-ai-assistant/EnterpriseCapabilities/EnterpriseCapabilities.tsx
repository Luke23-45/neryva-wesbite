import { motion } from 'framer-motion';
import { Palette, Database, ShieldAlert, Activity } from 'lucide-react';
import capsData from '@neryva_data/products/ai_enterprised/capabilities.json';
import {
  CapabilitiesSection,
  InnerContainer,
  AppsHeader,
  Subtext,
  SectionHeading,
  SectionDescription,
  AppsGrid,
  AppCell,
  CellIcon,
  CellTitle,
  CellDesc,
} from './EnterpriseCapabilities.styles';

const iconMap: Record<string, React.ElementType> = {
  Palette,
  Database,
  ShieldAlert,
  Activity,
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

export function EnterpriseCapabilities() {
  return (
    <CapabilitiesSection>
      <InnerContainer>
        <AppsHeader
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.div variants={fadeUp} custom={0}>
            <Subtext>{capsData.header.subtext}</Subtext>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <SectionHeading>{capsData.header.title}</SectionHeading>
          </motion.div>

          <motion.div variants={fadeUp} custom={2}>
            <SectionDescription>{capsData.header.description}</SectionDescription>
          </motion.div>
        </AppsHeader>

        <AppsGrid
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {capsData.items.map((item, i) => {
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

                <CellDesc>{item.description}</CellDesc>
              </AppCell>
            );
          })}
        </AppsGrid>
      </InnerContainer>
    </CapabilitiesSection>
  );
}
