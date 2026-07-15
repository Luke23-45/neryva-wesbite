import { motion } from 'framer-motion';
import appsData from '@neryva_data/solutions/applications.json';
import {
  AppsWrapper,
  InnerContainer,
  AppsHeader,
  AppsTitle,
  AppsDesc,
  AppsGrid,
  AppCard,
  AppCardVisual,
  AppCardNumber,
  AppCardContent,
  AppCardTitle,
  AppCardDesc,
} from './SolutionsApplications.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as any,
      delay: custom * 0.15,
    },
  }),
};

export function SolutionsApplications() {
  return (
    <AppsWrapper>
      <InnerContainer>
        <AppsHeader>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={0} variants={fadeUp}>
            <AppsTitle>{appsData.title}</AppsTitle>
            <AppsDesc>{appsData.description}</AppsDesc>
          </motion.div>
        </AppsHeader>

        <AppsGrid>
          {appsData.items.map((item, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={1 + i} variants={fadeUp} style={{ display: 'flex' }}>
              <AppCard>
                <AppCardVisual>
                  <AppCardNumber>APP // 0{i + 1}</AppCardNumber>
                </AppCardVisual>
                <AppCardContent>
                  <AppCardTitle>{item.title}</AppCardTitle>
                  <AppCardDesc>{item.description}</AppCardDesc>
                </AppCardContent>
              </AppCard>
            </motion.div>
          ))}
        </AppsGrid>
      </InnerContainer>
    </AppsWrapper>
  );
}
