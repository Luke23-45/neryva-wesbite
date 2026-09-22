import { motion } from 'framer-motion';
import capsData from '@neryva_data/products/ai_enterprised/capabilities.json';
import {
  CapabilitiesSection,
  InnerContainer,
  AppsHeader,
  SectionHeading,
  AppsGrid,
  AppCell,
  CellIcon,
  CellTitle,
  CellDesc,
} from './EnterpriseCapabilities.styles';

import { EnterpriseIcons } from '@/assets/icons/products/EnterpriseCapabilityIconMap';

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
          <motion.div variants={fadeUp} custom={1}>
            <SectionHeading>{capsData.header.title}</SectionHeading>
          </motion.div>

        </AppsHeader>

        <AppsGrid
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {capsData.items.map((item, i) => {
            const IconComponent = EnterpriseIcons[item.icon.toLowerCase()];

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
