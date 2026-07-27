import { motion } from 'framer-motion';
import capsData from '@neryva_data/products/deployment/capabilities.json';
import {
  DeploymentCapabilitiesSection,
  DeploymentCapabilitiesInnerContainer,
  DeploymentCapabilitiesAppsHeader,
  DeploymentCapabilitiesSectionHeading,
  DeploymentCapabilitiesAppsGrid,
  DeploymentCapabilitiesAppCell,
  DeploymentCapabilitiesCellIcon,
  DeploymentCapabilitiesCellTitle,
  DeploymentCapabilitiesCellDesc,
} from './DeploymentCapabilities.styles';

import { OpsFeatureIcon } from '@assets/visual/product/Deploymentcapablities';

const iconToOpsId: Record<string, string> = {
  cpu: 'optimized-runtimes',
  gauge: 'autoscaling-routing',
  activity: 'realtime-monitoring',
  shieldcheck: 'secure-access',
  filecheck: 'audit-compliance',
  workflow: 'model-release',
  headphones: 'managed-operations',
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

export function DeploymentCapabilities() {
  return (
    <DeploymentCapabilitiesSection>
      <DeploymentCapabilitiesInnerContainer>
        <DeploymentCapabilitiesAppsHeader
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.div variants={fadeUp} custom={1}>
            <DeploymentCapabilitiesSectionHeading>{capsData.header.title}</DeploymentCapabilitiesSectionHeading>
          </motion.div>
        </DeploymentCapabilitiesAppsHeader>

        <DeploymentCapabilitiesAppsGrid
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {capsData.items.map((item, i) => {
            const opsId = iconToOpsId[item.icon.toLowerCase()] || item.icon.toLowerCase();

            return (
              <DeploymentCapabilitiesAppCell
                key={item.title}
                as={motion.div}
                variants={fadeUp}
                custom={3 + i}
              >
                <DeploymentCapabilitiesCellIcon>
                  <OpsFeatureIcon id={opsId} />
                </DeploymentCapabilitiesCellIcon>

                <DeploymentCapabilitiesCellTitle>{item.title}</DeploymentCapabilitiesCellTitle>

                <DeploymentCapabilitiesCellDesc>{item.description}</DeploymentCapabilitiesCellDesc>
              </DeploymentCapabilitiesAppCell>
            );
          })}
        </DeploymentCapabilitiesAppsGrid>
      </DeploymentCapabilitiesInnerContainer>
    </DeploymentCapabilitiesSection>
  );
}
